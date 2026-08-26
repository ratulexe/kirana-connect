import ReactMarkdown from "react-markdown";

/**
 * Renders one AI Advisor answer as safe, formatted Markdown -- the model is
 * instructed to use bold/paragraphs/lists, and without this those markers
 * (**bold**, "* bullet") were showing up as literal characters instead of
 * formatting.
 *
 * Safety is structural, not a sanitizer bolted on afterward: react-markdown
 * parses Markdown to its own AST and renders that AST as real React
 * elements -- it never touches dangerouslySetInnerHTML and never executes
 * raw HTML found in the text (no rehype-raw plugin is used here, which is
 * the one thing that would turn that back on). There is nothing to
 * sanitize because there is no HTML-injection code path to begin with.
 *
 * `components` narrows the handful of tags Markdown can actually produce
 * down to this app's own styling, and closes the two remaining risky
 * surfaces explicitly: links are forced to open safely and only for
 * http(s)/mailto schemes (never `javascript:`), and images are not
 * rendered at all (the advisor has no legitimate reason to embed one, and
 * an <img src> is an unreviewed outbound network request).
 */
const SAFE_LINK_PROTOCOLS = ["http:", "https:", "mailto:"];

function isSafeHref(href) {
  if (!href) return false;
  try {
    // A relative URL still needs a base to parse; any concrete origin works
    // since only the scheme is inspected below.
    const url = new URL(href, "https://kiranaconnect.invalid");
    return SAFE_LINK_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

const markdownComponents = {
  p: ({ children }) => <p className="[&:not(:first-child)]:mt-2.5">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mt-2 mb-2 ml-4 grid list-disc gap-1">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 mb-2 ml-4 grid list-decimal gap-1">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  a: ({ href, children }) =>
    isSafeHref(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary">
        {children}
      </a>
    ) : (
      // An unsafe or malformed href still shows the link text, just inert --
      // never silently drops content the model wrote.
      <span>{children}</span>
    ),
  img: ({ alt }) => (alt ? <span>{alt}</span> : null),
  h1: ({ children }) => <p className="mt-2.5 font-semibold text-ink">{children}</p>,
  h2: ({ children }) => <p className="mt-2.5 font-semibold text-ink">{children}</p>,
  h3: ({ children }) => <p className="mt-2.5 font-semibold text-ink">{children}</p>,
  code: ({ children }) => (
    <code className="rounded bg-ink/8 px-1 py-0.5 text-[0.9em]">{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-2 border-l-2 border-line pl-3 text-ink-soft">{children}</blockquote>
  ),
};

export default function AdvisorMessageContent({ content }) {
  return (
    <div className="text-body [&>*:first-child]:mt-0">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
