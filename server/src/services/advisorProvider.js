import { env, isAiAdvisorConfigured } from "../config/env.js";
import { completeWithGemini } from "./advisorProviders/geminiProvider.js";

/**
 * BusinessAdvisorProvider abstraction. advisor.service.js calls
 * getAdvisorProvider() and only ever sees { name, complete(args) } -- it
 * never imports a vendor SDK or knows Gemini exists. Adding a second
 * provider later means one new entry in PROVIDERS and an env var change,
 * not touching advisor.service.js or the controller.
 */
const PROVIDERS = {
  gemini: { name: "gemini", complete: completeWithGemini },
};

/**
 * Returns null when no API key is configured, or the provider name is not
 * recognised -- both are "advisor unavailable", never a crash.
 */
export function getAdvisorProvider() {
  if (!isAiAdvisorConfigured) return null;
  return PROVIDERS[env.aiAdvisorProvider] ?? null;
}
