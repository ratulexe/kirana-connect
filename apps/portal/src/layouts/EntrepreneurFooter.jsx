import { ArrowUpRight } from 'lucide-react';
import Container from '../components/common/Container.jsx';
import { CONSUMER_APP_URL } from '../config/urls.js';

export default function EntrepreneurFooter() {
  return (
    <footer className="print-hide border-t border-line bg-surface-sunken">
      <Container className="py-8 sm:py-10">
        <div className="max-w-md">
          <span className="inline-flex items-baseline gap-1">
            <span className="text-[1.0625rem] font-bold tracking-tight text-ink">Kirana</span>
            <span className="gradient-text text-[1.0625rem] font-bold tracking-tight">Connect</span>
          </span>
          <p className="mt-2 text-body text-ink-muted">
            Data-backed business intelligence for local entrepreneurs.
          </p>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <p className="text-meta text-ink-muted">Looking for products nearby?</p>
          <a
            href={CONSUMER_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-meta font-semibold text-primary hover:text-primary-hover"
          >
            Visit Consumer Platform
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>

        <p className="mt-6 text-meta text-ink-muted">
          &copy; {new Date().getFullYear()} Kirana Connect
        </p>
      </Container>
    </footer>
  );
}
