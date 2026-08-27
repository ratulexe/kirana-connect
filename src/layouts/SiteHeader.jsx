import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookmarkCheck, Heart, LogOut, Search, UserRound, Zap } from 'lucide-react';
import Container from '../components/common/Container.jsx';
import IconButton from '../components/common/IconButton.jsx';
import ConsumerSearchBar from '../components/common/ConsumerSearchBar.jsx';
import LocationControl from '../components/common/LocationControl.jsx';
import AuthDrawer from '../components/common/AuthDrawer.jsx';
import { useAuth } from '../auth/useAuth.js';
import { useCustomerProfile } from '../features/customer/useCustomer.js';
import { useWishlist } from '../hooks/useWishlist.js';

/**
 * Parkinsans (the body font) rather than a display/script face, so the
 * wordmark stays legible at every size and never used for a paragraph or a
 * control, per this app's own type rule). The entrance moment lives in the
 * app-level loading screen (see AppLoader.jsx / App.jsx), not here -- an
 * animation on the header too would just be a redundant second entrance
 * right after that one finishes.
 */
function Wordmark() {
  return (
    <Link
      to="/"
      className="group inline-flex shrink-0 items-center rounded-control py-2"
      aria-label="Kirana Connect, go to home"
    >
      <span className="inline-block font-sans text-[1.375rem] font-extrabold tracking-tight text-ink sm:text-[1.625rem]">
        Kirana{" "}
        <span className="bg-gradient-to-r from-[#7c3aed] via-[#e93483] to-[#ffd45e] bg-clip-text text-transparent">
          Connect
        </span>
      </span>
    </Link>
  );
}

function AccountControl({ onSignInClick }) {
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
      <button
        type="button"
        onClick={onSignInClick}
        className="neon-btn inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-meta font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary-soft"
      >
        <UserRound className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  const name = profile.data?.full_name || auth.user?.email || 'Account';

  const MENU_ITEMS = [
    { icon: UserRound, label: 'Account', to: '/account' },
    { icon: BookmarkCheck, label: 'My reservations', to: '/reserved' },
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
  const routerLocation = useLocation();
  const { ids: wishlistIds } = useWishlist();
  const wishlistCount = wishlistIds.length;
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  // The /search page renders its own prominent, live ConsumerSearchBar (see
  // SearchResults.jsx) -- the header's copy steps aside there so there is
  // never a moment with two visible search bars on screen at once.
  const onSearchPage = routerLocation.pathname === '/search';

  // Published as a CSS var so any page can stick its own content directly
  // below this sticky header without hard-coding a height that drifts every
  // time the promo strip wraps to a second line. SearchResults.jsx's sticky
  // search bar is the current consumer.
  const headerRef = useRef(null);
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return undefined;
    const setHeightVar = () => {
      document.documentElement.style.setProperty('--kc-header-h', `${node.offsetHeight}px`);
    };
    setHeightVar();
    const observer = new ResizeObserver(setHeightVar);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // /search owns its own compact top bar (back button + the live search
  // field, see SearchResults.jsx) instead of stacking a second search row
  // under the full promo-strip/logo/category-nav header -- matching the
  // focused single-row search header pattern of Zepto/Instamart, and
  // reclaiming the vertical space the old stacked layout wasted.
  if (onSearchPage) return null;

  return (
    <header ref={headerRef} className="sticky top-0 z-50">
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
              <ConsumerSearchBar
                mode="launcher"
                size="md"
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

              {/* Notifications -- no unread badge here: there is no real
                  notification backend yet (NotificationsPage's list is
                  always empty), so a dot would be decoration pretending to
                  be a signal. Wire this back in once notifications are real,
                  keyed off an actual unread count. */}
              <Link to="/notifications" aria-label="Notifications" className="hidden sm:inline-flex size-9 items-center justify-center rounded-control border border-line bg-surface text-ink-soft transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary">
                <Bell className="size-4" />
              </Link>

              {/* Wishlist -- replaces the old floating "quick actions" FAB
                  as the way to reach it outside the account dropdown. Badge
                  is the real localStorage-backed wishlist count, never shown
                  as 0. */}
              <Link to="/wishlist" aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} saved` : 'Wishlist'} className="relative hidden sm:inline-flex size-9 items-center justify-center rounded-control border border-line bg-surface text-ink-soft transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary">
                <Heart className="size-4" />
                {wishlistCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-primary px-1 text-[10px] font-bold text-primary-fg">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                ) : null}
              </Link>

              <AccountControl onSignInClick={() => setAuthDrawerOpen(true)} />
            </div>
          </div>
        </Container>
      </div>

      <AuthDrawer open={authDrawerOpen} onClose={() => setAuthDrawerOpen(false)} />
    </header>
  );
}
