import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Heart, LogOut, Search, UserRound, Zap } from 'lucide-react';
import Container from '../components/common/Container.jsx';
import IconButton from '../components/common/IconButton.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import LocationControl from '../components/common/LocationControl.jsx';
import DarkModeToggle from '../components/common/DarkModeToggle.jsx';
import { useAuth } from '../auth/useAuth.js';
import { useCustomerProfile } from '../features/customer/useCustomer.js';
import { useCategories } from '../hooks/useCategories.js';

const CATEGORY_NAV_LIMIT = 8;

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
          className="absolute -top-0.5 right-[1.5px] size-[5px] rounded-pill bg-accent live-dot transition-transform duration-200 ease-brand group-hover:scale-125"
        />
      </span>
      <span className="gradient-text text-[1.0625rem] font-bold tracking-tight sm:text-[1.1875rem]">
        Connect
      </span>
    </Link>
  );
}

function AccountControl() {
  const auth = useAuth();
  const profile = useCustomerProfile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, [open]);

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
        className="neon-btn inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-meta font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary-soft"
      >
        <UserRound className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const name = profile.data?.full_name || auth.user?.email || 'Account';

  const MENU_ITEMS = [
    { icon: UserRound, label: 'Account', to: '/account' },
    { icon: Heart, label: 'Wishlist', to: '/wishlist' },
    { icon: Bell, label: 'Notifications', to: '/notifications' },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="neon-btn inline-flex h-9 max-w-[11rem] items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-meta font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary-soft"
      >
        <UserRound className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden min-w-0 truncate sm:block">{name}</span>
      </button>

      {open ? (
        <div className="glass-card absolute right-0 mt-2 w-56 rounded-card border border-line/50 p-2 shadow-float animate-slide-up">
          {MENU_ITEMS.map(({ icon: Icon, label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-control px-3 py-2.5 text-meta font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink transition-colors"
            >
              <Icon className="size-4 text-primary" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <div className="my-1.5 border-t border-line" />
          <button
            type="button"
            onClick={async () => { setOpen(false); await auth.signOut(); }}
            className="flex w-full items-center gap-2 rounded-control px-3 py-2.5 text-left text-meta font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink transition-colors"
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
  const { data: categories } = useCategories();
  const navCategories = (categories ?? []).slice(0, CATEGORY_NAV_LIMIT);

  const handleSearch = (term) => {
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Promo strip */}
      <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#e93483] via-[#7c3aed] to-[#4f36d9] py-1.5 text-center text-[11px] font-bold tracking-wider text-white">
        <Zap className="size-3 shrink-0 fill-current" aria-hidden="true" />
        FLASH DEALS LIVE NOW — Prices updated daily from local stores!{' '}
        <Link to="/best-offers" className="underline underline-offset-2 hover:text-[#ffd45e] transition-colors">Shop Now →</Link>
      </div>

      {/* Main header */}
      <div className="relative z-10 border-b border-white/40 bg-white/85 shadow-[0_6px_24px_rgba(49,36,118,.05)] backdrop-blur-2xl">
        <Container>
          <div className="flex h-14 items-center gap-3 lg:h-16 lg:gap-6">
            <Wordmark />

            <div className="hidden min-w-0 flex-1 md:block">
              <SearchBar
                size="md"
                showSubmit={false}
                placeholder="Search milk, atta, tea..."
                label="Search products"
                onSubmit={handleSearch}
                className="mx-auto max-w-xl focus-within:shadow-[0_0_20px_rgba(79,54,217,0.2)]"
              />
            </div>

            <div className="ml-auto flex items-center gap-1.5 md:ml-0">
              <LocationControl className="hidden sm:block" />
              <LocationControl compact className="sm:hidden" />
              <IconButton
                label="Search products"
                icon={Search}
                variant="ghost"
                size="sm"
                className="sm:hidden"
                onClick={() => navigate('/search')}
              />

              {/* Notifications */}
              <Link to="/notifications" aria-label="Notifications" className="relative hidden sm:inline-flex size-9 items-center justify-center rounded-control border border-line bg-surface text-ink-soft transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary">
                <Bell className="size-4" />
                <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500 live-dot" />
              </Link>

              <DarkModeToggle />
              <AccountControl />
            </div>
          </div>
        </Container>
      </div>

      {/* Category nav */}
      {navCategories.length > 0 ? (
        <div className="hidden border-b border-line/50 bg-white/70 backdrop-blur-xl lg:block">
          <Container>
            <nav className="flex gap-0.5 py-1.5" aria-label="Category navigation">
              {navCategories.map(({ name, slug }) => (
                <Link
                  key={slug}
                  to={`/search?category=${slug}`}
                  className="rounded-control px-3 py-1.5 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-primary-soft hover:text-primary"
                >
                  {name}
                </Link>
              ))}
            </nav>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
