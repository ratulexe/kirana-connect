import { Link } from "react-router-dom";
import { ChevronDown, MapPin, UserRound } from "lucide-react";
import Container from "../components/common/Container.jsx";
import IconButton from "../components/common/IconButton.jsx";
import SearchBar from "../components/common/SearchBar.jsx";

/**
 * Wordmark. Text only, with a single accent mark on the "i" of Kirana so the
 * brand has a memorable detail without needing a logo asset.
 */
function Wordmark() {
  return (
    <Link
      to="/"
      className="group inline-flex shrink-0 items-baseline gap-1 rounded-control py-2"
      aria-label="Kirana Connect, go to home"
    >
      <span className="relative text-[1.0625rem] font-bold tracking-tight text-ink sm:text-[1.1875rem]">
        Kirana
        <span
          aria-hidden="true"
          className="absolute -top-0.5 right-[1.5px] size-[5px] rounded-pill bg-accent transition-transform duration-200 ease-brand group-hover:scale-125"
        />
      </span>
      <span className="text-[1.0625rem] font-medium tracking-tight text-primary sm:text-[1.1875rem]">
        Connect
      </span>
    </Link>
  );
}

/**
 * Location control.
 *
 * A real button with a real accessible name, but intentionally inert: the
 * location picker arrives with the discovery milestone. It is a shell, not a
 * pretend feature.
 */
function LocationPicker() {
  return (
    <button
      type="button"
      aria-label="Set your location. Location picker coming soon"
      className="group flex max-w-[11rem] items-center gap-1.5 rounded-control px-2 py-1.5 text-left transition-colors duration-150 ease-brand hover:bg-surface-sunken"
    >
      <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-[0.6875rem] leading-none text-ink-muted">Shops near</span>
        <span className="mt-0.5 block truncate text-meta font-semibold text-ink">
          Set location
        </span>
      </span>
      <ChevronDown
        className="size-3.5 shrink-0 text-ink-muted transition-transform duration-150 ease-brand group-hover:translate-y-px"
        aria-hidden="true"
      />
    </button>
  );
}

export default function SiteHeader({ onSearch }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-canvas/85 backdrop-blur-md">
      <Container>
        <div className="flex h-14 items-center gap-3 lg:h-16 lg:gap-6">
          <Wordmark />

          {/* Compact search lives in the header from tablet up; on phones the
              hero search is the entry point and this would crowd the bar. */}
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar
              size="md"
              showSubmit={false}
              placeholder="Search milk, atta, tea..."
              label="Search products"
              onSubmit={onSearch}
              className="mx-auto max-w-xl"
            />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            {/* Wrapped rather than given a responsive display class directly:
                the button's own `flex` would otherwise compete with `hidden`,
                and CSS order, not class order, decides that fight. */}
            <div className="hidden sm:block">
              <LocationPicker />
            </div>
            <IconButton
              label="Set your location"
              icon={MapPin}
              variant="ghost"
              size="sm"
              className="sm:hidden"
            />
            <IconButton
              label="Account. Sign in coming soon"
              icon={UserRound}
              variant="outline"
              size="sm"
            />
          </div>
        </div>
      </Container>
    </header>
  );
}
