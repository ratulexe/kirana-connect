import { Link, useNavigate } from "react-router-dom";
import { Search, UserRound } from "lucide-react";
import Container from "../components/common/Container.jsx";
import IconButton from "../components/common/IconButton.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import LocationControl from "../components/common/LocationControl.jsx";

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

export default function SiteHeader() {
  const navigate = useNavigate();

  const handleSearch = (term) => {
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };

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
              onSubmit={handleSearch}
              className="mx-auto max-w-xl"
            />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <LocationControl className="hidden sm:block" />
            <LocationControl compact className="sm:hidden" />
            <IconButton
              label="Search products"
              icon={Search}
              variant="ghost"
              size="sm"
              className="sm:hidden"
              onClick={() => navigate("/search")}
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
