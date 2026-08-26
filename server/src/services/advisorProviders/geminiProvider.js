import { env } from "../../config/env.js";

/**
 * The one place that talks to Google's Gemini API. Endpoint, request shape
 * and response shape verified against the current (August 2026) official
 * REST reference before writing this -- generateContent under v1beta, API
 * key passed as the x-goog-api-key header (never a query string, so it
 * never ends up in a server access log), model name configurable via
 * AI_ADVISOR_MODEL rather than hard-coded, since Gemini model names are
 * retired on a rolling basis.
 */

const REQUEST_TIMEOUT_MS = 20_000;
const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

function extractText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  return parts.map((part) => part.text ?? "").join("").trim() || null;
}

/**
 * { systemInstruction, messages: [{role: "user"|"model", text}], temperature, maxOutputTokens }
 * -> { status: "ok", text } | { status: "unavailable" | "timeout" | "blocked" | "rate-limited", message }
 * Never throws -- a provider outage must degrade to an advisor error state,
 * never take the request down with it. "rate-limited" (HTTP 429) is its own
 * status so advisor.service.js can show a specific, non-technical message
 * instead of a generic "provider error" -- the free tier's daily quota is
 * low enough that judges/demo users will realistically hit this.
 */
export async function completeWithGemini({ systemInstruction, messages, temperature, maxOutputTokens }) {
  const url = `${API_ROOT}/${encodeURIComponent(env.aiAdvisorModel)}:generateContent`;

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: {
      temperature,
      maxOutputTokens,
      // Gemini 3.x models think by default, and thinking tokens are drawn
      // from the same maxOutputTokens budget -- left uncapped, the visible
      // answer was getting truncated mid-sentence (worst for Bengali/Hindi,
      // which need more tokens per word than English). "low" keeps enough
      // reasoning for the grounding rules to hold without eating the budget
      // meant for the answer itself.
      thinkingConfig: { thinkingLevel: "low" },
    },
  };

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.aiAdvisorApiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      console.error("[kirana-connect-api] AI advisor request timed out");
      return { status: "timeout", message: "The AI Advisor took too long to respond." };
    }
    // Never log error.message here unfiltered -- fetch failures on Node can
    // occasionally echo request options; the model/status is enough context.
    console.error("[kirana-connect-api] AI advisor request failed to reach the provider");
    return { status: "unavailable", message: "Could not reach the AI Advisor provider." };
  }

  if (!response.ok) {
    console.error(`[kirana-connect-api] AI advisor provider responded with status ${response.status}`);
    if (response.status === 429) {
      return { status: "rate-limited", message: "The AI Advisor provider's request quota was exceeded." };
    }
    return { status: "unavailable", message: "The AI Advisor provider returned an error." };
  }

  const payload = await response.json().catch(() => null);
  if (!payload) {
    console.error("[kirana-connect-api] AI advisor provider response was not valid JSON");
    return { status: "unavailable", message: "The AI Advisor provider returned an unreadable response." };
  }

  const finishReason = payload?.candidates?.[0]?.finishReason;
  if (finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT") {
    return { status: "blocked", message: "The AI Advisor could not answer that question." };
  }

  const text = extractText(payload);
  if (!text) {
    console.error("[kirana-connect-api] AI advisor provider response had no text content");
    return { status: "unavailable", message: "The AI Advisor provider returned an empty response." };
  }

  return { status: "ok", text };
}
