import { Component } from "react";
import { TriangleAlert } from "lucide-react";

/**
 * One module crashing (a bad render in Market, say) must not take the
 * whole analysis screen down with it -- Finance, Risks & SWOT and the
 * Advisor should stay usable regardless. Deliberately minimal: no retry
 * queue, no error reporting service, just isolation plus a plain message.
 */
export default class AnalysisErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`[kirana-connect-portal] ${this.props.label ?? "Analysis section"} crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mt-5 flex items-start gap-2.5 rounded-card border border-danger/30 bg-danger/10 p-4">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="text-body font-semibold text-ink">
              {this.props.label ?? "This section"} could not be displayed.
            </p>
            <p className="mt-1 text-meta text-ink-muted">
              The rest of your report is unaffected -- try another tab, or refresh the page.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
