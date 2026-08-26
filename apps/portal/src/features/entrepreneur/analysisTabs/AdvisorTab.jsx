import { lazy, Suspense, useId, useRef, useState } from "react";
import { MessagesSquare, Send, TriangleAlert, Loader2 } from "lucide-react";
import { sendAdvisorMessage } from "../../../services/advisor.js";
import { ADVISOR_LANGUAGES, DEFAULT_ADVISOR_LANGUAGE, SUGGESTED_QUESTIONS, ADVISOR_STRINGS } from "../advisorLanguages.js";

// react-markdown pulls in its own AST toolchain (unified/remark/hast) --
// worth its own chunk exactly like CompetitorMap, since every other
// analysis tab (Overview/Market/Finance/Risks) would otherwise carry that
// weight in the main bundle for entrepreneurs who never open the Advisor.
const AdvisorMessageContent = lazy(() => import("../AdvisorMessageContent.jsx"));

const QUESTION_MAX_LENGTH = 2000;
const RECENT_MESSAGES_SENT = 10;

/**
 * The AI Advisor as a stable, always-mounted-while-active tab section --
 * not a Drawer. There is no open/close lifecycle, no focus trap, and no
 * effect that re-runs on every keystroke and steals focus (that was the
 * root cause of the old Drawer-based panel closing while typing; see the
 * final report for the full diagnosis). A normal controlled <textarea>
 * inside a normal section has none of those failure modes by construction.
 *
 * Chat state is component-local -- switching away from this tab and back
 * (or a page refresh) clears the conversation, deliberately, since no chat
 * history is ever persisted (see the privacy requirement from the original
 * Advisor milestone). `context` is the already-built, already-summarized
 * advisor context object (see buildAdvisorContext.js).
 */
export default function AdvisorTab({ context, entrepreneurSummary }) {
  const [language, setLanguage] = useState(DEFAULT_ADVISOR_LANGUAGE);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [bannerError, setBannerError] = useState(null);
  const [providerDisabled, setProviderDisabled] = useState(false);

  const titleId = useId();
  const statusId = useId();
  const abortRef = useRef(null);

  async function submitQuestion(question) {
    const trimmed = question.trim();
    if (!trimmed || isSending || providerDisabled) return;

    setBannerError(null);
    const userMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const recentMessages = nextMessages.slice(-RECENT_MESSAGES_SENT - 1, -1);
      const result = await sendAdvisorMessage({
        language,
        question: trimmed,
        reportContext: context,
        recentMessages,
        signal: controller.signal,
      });

      if (result.status === "ok") {
        setMessages((current) => [...current, { role: "assistant", content: result.answer }]);
      } else if (result.status === "not-configured") {
        setProviderDisabled(true);
        setBannerError(ADVISOR_STRINGS.notConfigured);
      } else {
        // The question failed to get an answer -- restore it to the draft
        // rather than silently discarding what the user typed, so they can
        // just press Send again instead of retyping.
        setMessages(messages);
        setInput(trimmed);
        setBannerError(result.message || ADVISOR_STRINGS.genericError);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        setMessages(messages);
        setInput(trimmed);
        setBannerError(ADVISOR_STRINGS.genericError);
      }
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitQuestion(input);
  }

  const suggestions = SUGGESTED_QUESTIONS[language] ?? SUGGESTED_QUESTIONS.en;

  return (
    <div className="py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 id={titleId} className="text-heading text-ink">
            Ask Kirana Advisor
          </h1>
          {entrepreneurSummary ? <p className="mt-1 text-body text-ink-muted">{entrepreneurSummary}</p> : null}
        </div>
      </div>

      <p className="mt-3 max-w-2xl text-meta text-ink-muted">
        Ask about your financial roadmap, demand, competition, risks, or SWOT. Answers are grounded in the
        report calculated above -- the advisor explains it, it does not recalculate it.
      </p>

      <div className="mt-5 flex items-center gap-1.5">
        <span className="text-meta font-semibold text-ink-muted" id={`${titleId}-lang-label`}>
          Language
        </span>
        <div className="ml-2 flex gap-1" role="group" aria-labelledby={`${titleId}-lang-label`}>
          {ADVISOR_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              aria-pressed={language === lang.code}
              className={`rounded-pill border px-2.5 py-1 text-meta font-semibold transition-colors ${
                language === lang.code
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-line bg-surface text-ink-soft hover:border-ink-muted"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex min-h-[24rem] flex-col rounded-panel border border-line bg-surface">
        <div className="flex-1 overflow-y-auto p-4 sm:p-5" aria-live="polite">
          {messages.length === 0 ? (
            <div>
              <p className="flex items-center gap-2 text-meta font-semibold text-ink-soft">
                <MessagesSquare className="size-4 shrink-0 text-primary" aria-hidden="true" />
                Suggested questions
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {suggestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => submitQuestion(question)}
                    disabled={providerDisabled}
                    className="rounded-control border border-line bg-surface-sunken px-3.5 py-2.5 text-left text-meta text-ink-soft transition-colors hover:border-primary hover:text-ink disabled:pointer-events-none disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="grid gap-3">
              {messages.map((message, index) => (
                <li
                  key={index}
                  className={`max-w-[85%] rounded-card px-3.5 py-2.5 ${
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-fg whitespace-pre-wrap"
                      : "mr-auto border border-line bg-surface-sunken text-ink"
                  }`}
                >
                  {message.role === "assistant" ? (
                    // Only the model's own answers are parsed as Markdown --
                    // the entrepreneur's own typed question is shown exactly
                    // as typed, never reinterpreted as formatting syntax.
                    <Suspense fallback={<p className="whitespace-pre-wrap">{message.content}</p>}>
                      <AdvisorMessageContent content={message.content} />
                    </Suspense>
                  ) : (
                    message.content
                  )}
                </li>
              ))}
            </ul>
          )}

          {isSending ? (
            <p id={statusId} className="mt-3 flex items-center gap-2 text-meta text-ink-muted">
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
              Kirana Advisor is thinking...
            </p>
          ) : null}

          {bannerError ? (
            <p role="alert" className="mt-3 flex items-start gap-2 rounded-card border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-meta text-ink-soft">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden="true" />
              {bannerError}
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-line px-4 py-3.5 sm:px-5">
          <div className="flex items-end gap-2">
            <label htmlFor={`${titleId}-input`} className="sr-only">
              Ask Kirana Advisor a question
            </label>
            <textarea
              id={`${titleId}-input`}
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, QUESTION_MAX_LENGTH))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitQuestion(input);
                }
              }}
              disabled={providerDisabled}
              rows={2}
              maxLength={QUESTION_MAX_LENGTH}
              placeholder="Ask a question about your report... (Enter to send, Shift+Enter for a new line)"
              className="min-h-16 flex-1 resize-none rounded-control border border-line bg-surface px-3 py-2.5 text-body text-ink outline-none placeholder:text-ink-muted focus:border-primary disabled:text-ink-muted"
            />
            <button
              type="submit"
              disabled={isSending || providerDisabled || !input.trim()}
              aria-label="Send question to Kirana Advisor"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-control bg-primary text-primary-fg transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-45"
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
