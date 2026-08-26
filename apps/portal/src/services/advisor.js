import { apiPost } from "../lib/apiBase.js";

/**
 * Sends one advisor question, plus a short conversation history and the
 * current report's structured context. All AI calls go through the Kirana
 * Connect backend -- the Portal never talks to an AI provider directly.
 * Returns { status: "ok", answer } | { status: "not-configured" | "error", message }.
 */
export async function sendAdvisorMessage({ language, question, reportContext, recentMessages, signal }) {
  return apiPost(
    "/api/entrepreneur/advisor",
    { language, question, reportContext, recentMessages },
    { signal },
  );
}
