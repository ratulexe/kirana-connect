import { Link, useNavigate } from "react-router-dom";
import { LogOut, Search, UserRound } from "lucide-react";
import { useState } from "react";
import Container from "../components/common/Container.jsx";
import IconButton from "../components/common/IconButton.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import LocationControl from "../components/common/LocationControl.jsx";
import { useAuth } from "../auth/useAuth.js";
import { useCustomerProfile } from "../features/customer/useCustomer.js";

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

function AccountControl() {
  const auth = useAuth();
  const profile = useCustomerProfile();
  const [open, setOpen] = useState(false);

  if (auth.isLoading) {
    return (
      <span className="inline-flex size-9 items-center justify-center rounded-control border border-line bg-surface" aria-label="Loading account">
        <UserRound className="size-4 text-ink-muted" aria-hidden="true" />
      </span>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Link
        to="/login"
        className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-meta font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary-soft"
      >
        <UserRound className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const name = profile.data?.full_name || auth.user?.email || "Account";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="inline-flex h-9 max-w-[11rem] items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-meta font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary-soft"
      >
        <UserRound className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden min-w-0 truncate sm:block">{name}</span>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-card border border-line bg-surface p-2 shadow-float">
          <Link
            to="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-control px-3 py-2 text-meta font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink"
          >
            <UserRound className="size-4" aria-hidden="true" />
            Account
          </Link>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await auth.signOut();
            }}
            className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-meta font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
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
            <AccountControl />
          </div>
        </div>
      </Container>
    </header>
  );
}
