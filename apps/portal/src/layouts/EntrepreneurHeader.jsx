import { Link } from 'react-router-dom';
import Container from '../components/common/Container.jsx';

/**
 * Deliberately minimal: the Entrepreneur Platform is a business advisory
 * surface, not a storefront, so this carries none of the Consumer app's
 * shopping chrome (search, cart, categories, notifications, account
 * controls, Flash Deals).
 *
 * The entrance moment lives in the app-level loading screen shown once on
 * entering the Business experience (see AppLoader.jsx / EntrepreneurLayout),
 * not here.
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
            <span className="inline-block font-sans text-[1.25rem] font-extrabold tracking-tight text-ink sm:text-[1.5rem]">
              Kirana{" "}
              <span className="bg-gradient-to-r from-[#7c3aed] via-[#e93483] to-[#ffd45e] bg-clip-text text-transparent">
                Connect
              </span>{" "}
              <span className="text-primary">Business</span>
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
