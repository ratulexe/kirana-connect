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
            className="group inline-flex shrink-0 items-center rounded-control py-2"
            aria-label="Kirana Connect Business, go to Entrepreneur home"
          >
            <span className="relative font-brand text-[1.75rem] leading-none font-normal text-ink sm:text-[2rem]">
              Kirana Connect <span className="text-primary">Business</span>
              <span
                aria-hidden="true"
                className="absolute top-0 right-[-0.5rem] size-[5px] rounded-pill bg-accent live-dot transition-transform duration-200 ease-brand group-hover:scale-125"
              />
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
