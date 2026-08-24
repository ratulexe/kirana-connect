import dns from "node:dns/promises";
import net from "node:net";
import { httpError } from "../utils/httpError.js";

const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 6000;
const MAX_PAGE_BYTES = 512 * 1024;
const IMAGE_EXTENSIONS = /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;

function isHttpUrl(url) {
  return url.protocol === "http:" || url.protocol === "https:";
}

function isPinterestHost(hostname) {
  const host = hostname.toLowerCase();
  return host === "pin.it" || host === "pinterest.com" || host === "www.pinterest.com" || host.endsWith(".pinterest.com");
}

function isPrivateAddress(address) {
  const version = net.isIP(address);
  if (version === 0) return true;
  if (version === 4) {
    const parts = address.split(".").map(Number);
    const [a, b] = parts;
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0 ||
      a >= 224
    );
  }

  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized === "::" ||
    normalized.startsWith("64:ff9b:")
  );
}

async function assertSafeUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw httpError(400, "Image URL must be a valid http or https URL.");
  }

  if (!isHttpUrl(url)) throw httpError(400, "Image URL must use http or https.");
  if (!url.hostname || ["localhost", "metadata.google.internal"].includes(url.hostname.toLowerCase())) {
    throw httpError(400, "That image URL is not allowed.");
  }

  const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) {
    throw httpError(400, "That image URL points to a private network address.");
  }

  return url;
}

async function fetchLimited(url, { accept, redirects = 0 } = {}) {
  const safeUrl = await assertSafeUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(safeUrl, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: accept ?? "text/html,application/xhtml+xml",
        "User-Agent": "KiranaConnectImageResolver/1.0",
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw httpError(400, "Image URL resolution timed out.");
    }
    throw httpError(400, "Could not reach that image URL.");
  } finally {
    clearTimeout(timer);
  }

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirects >= MAX_REDIRECTS) throw httpError(400, "Image URL redirects too many times.");
    const location = response.headers.get("location");
    if (!location) throw httpError(400, "Image URL redirect is missing a destination.");
    return fetchLimited(new URL(location, safeUrl).toString(), { accept, redirects: redirects + 1 });
  }

  return response;
}

async function readTextLimited(response) {
  if (!response.ok) throw httpError(400, "Pinterest image URL could not be resolved.");
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw httpError(400, "Pinterest URL did not return a readable page.");
  }

  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks = [];
  let total = 0;
  while (total < MAX_PAGE_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_PAGE_BYTES) break;
    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractOgImage(html) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /"og:image"[^>]+content="([^"]+)"/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return null;
}

function isPinterestPlaceholderImage(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.toLowerCase().endsWith("pinimg.com") &&
      /\/images\/(facebook_share_image|pinterest-logo)/i.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

async function assertRenderableImage(url) {
  const safeUrl = await assertSafeUrl(url);
  if (IMAGE_EXTENSIONS.test(safeUrl.pathname)) return safeUrl.toString();

  const response = await fetchLimited(safeUrl.toString(), { accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,image/svg+xml" });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.startsWith("image/")) {
    await response.body?.cancel();
    throw httpError(400, "Resolved URL is not a renderable image.");
  }
  await response.body?.cancel();
  return safeUrl.toString();
}

export async function resolveImageUrl(inputUrl) {
  const original = String(inputUrl ?? "").trim();
  if (!original) return null;

  const url = await assertSafeUrl(original);
  if (!isPinterestHost(url.hostname)) {
    return {
      original_url: original,
      resolved_url: await assertRenderableImage(url.toString()),
      source_type: "direct",
    };
  }

  const response = await fetchLimited(url.toString(), { accept: "text/html,application/xhtml+xml" });
  const finalUrl = response.url || url.toString();
  const finalParsed = await assertSafeUrl(finalUrl);
  if (!isPinterestHost(finalParsed.hostname)) {
    throw httpError(400, "Pinterest URL did not resolve to Pinterest.");
  }

  const html = await readTextLimited(response);
  const ogImage = extractOgImage(html);
  if (!ogImage || isPinterestPlaceholderImage(ogImage)) {
    throw httpError(400, "Pinterest image could not be resolved. Upload an image or use a direct image URL.");
  }

  return {
    original_url: original,
    resolved_url: await assertRenderableImage(new URL(ogImage, finalParsed).toString()),
    source_type: "pinterest",
  };
}
