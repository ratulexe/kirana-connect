/**
 * Advisor-only multilingual config (Module 11). Stable internal codes
 * (en/bn/hi) matter more than the display labels -- these are sent to the
 * backend and must match server/src/utils/validateAdvisorContext.js's
 * whitelist exactly. Only the advisor's own answers and suggested-question
 * starters are localized this milestone; the rest of the Portal UI stays
 * English, per this milestone's explicit scope.
 */
export const ADVISOR_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
  { code: "hi", label: "हिन्दी" },
];

export const DEFAULT_ADVISOR_LANGUAGE = "en";

export const SUGGESTED_QUESTIONS = {
  en: [
    "Is this business currently feasible?",
    "Explain my loan and repayment.",
    "What are the biggest risks?",
    "What data is still missing?",
  ],
  bn: [
    "এই ব্যবসাটি কি এখন শুরু করা সম্ভব?",
    "আমার ঋণ ও পরিশোধের বিষয়টি ব্যাখ্যা করুন।",
    "সবচেয়ে বড় ঝুঁকিগুলো কী কী?",
    "কোন তথ্য এখনও অনুপস্থিত?",
  ],
  hi: [
    "क्या यह व्यवसाय अभी व्यवहार्य है?",
    "मेरे लोन और पुनर्भुगतान के बारे में समझाइए।",
    "सबसे बड़े जोखिम क्या हैं?",
    "कौन सी जानकारी अभी उपलब्ध नहीं है?",
  ],
};

export const ADVISOR_STRINGS = {
  notConfigured: "AI Business Advisor is not configured on this environment.",
  genericError: "The AI Advisor is temporarily unavailable. Your calculated business report is still available below.",
};
