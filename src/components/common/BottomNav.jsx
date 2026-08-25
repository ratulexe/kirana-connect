import { Link, useLocation } from 'react-router-dom';
import { House, Package, Search, Tag, UserRound } from 'lucide-react';

const TABS = [
  { label: 'Home', icon: House, to: '/' },
  { label: 'Search', icon: Search, to: '/search' },
  { label: 'Deals', icon: Tag, to: '/best-offers' },
  { label: 'Orders', icon: Package, to: '/orders' },
  { label: 'Account', icon: UserRound, to: '/account' },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Main navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="flex bg-white/95 backdrop-blur-2xl border-t border-line shadow-[0_-8px_32px_rgba(79,54,217,0.08)]">
        {TABS.map(({ label, icon: Icon, to }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-all duration-200 ${
                isActive ? 'text-primary' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className={`rounded-xl transition-all duration-200 ${
                isActive ? 'bg-primary-soft p-1.5 scale-110' : 'p-1.5'
              }`}>
                <Icon className="size-5" strokeWidth={isActive ? 2.5 : 1.8} />
              </span>
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
