import { Link } from 'react-router-dom';
import Container from '../components/common/Container.jsx';

/**
 * Deliberately minimal: the Entrepreneur Platform is a business advisory
 * surface, not a storefront, so this carries none of the Consumer app's
 * shopping chrome (search, cart, categories, notifications, account
 * controls, Flash Deals).
 */
export default function EntrepreneurHeader() {
  return (
    <header className="print-hide sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-xl">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            to="/entrepreneur"
            className="group inline-flex shrink-0 items-baseline gap-1 rounded-control py-2"
            aria-label="Kirana Connect, go to Entrepreneur home"
          >
            <span className="relative text-[1.0625rem] font-bold tracking-tight text-ink sm:text-[1.1875rem]">
              Kirana
              <span
                aria-hidden="true"
                className="absolute -top-0.5 right-[1.5px] size-[5px] rounded-pill bg-accent live-dot transition-transform duration-200 ease-brand group-hover:scale-125"
              />
            </span>
            <span className="gradient-text text-[1.0625rem] font-bold tracking-tight sm:text-[1.1875rem]">
              Connect
            </span>
          </Link>

          {/* Right side: reserved for a future language selector alongside this label. */}
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-meta font-semibold tracking-wide text-ink-muted uppercase">
              Business Advisory
            </span>
          </div>
        </div>
      </Container>
    </header>
  );
}
