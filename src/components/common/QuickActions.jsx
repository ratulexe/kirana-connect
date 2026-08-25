import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Heart, MapPin, Package, Search, ShoppingCart, X, Zap } from 'lucide-react';

const ACTIONS = [
  { label: 'Search', icon: Search, to: '/search', color: 'from-indigo-500 to-violet-600' },
  { label: 'Cart', icon: ShoppingCart, to: '/cart', color: 'from-orange-400 to-pink-500' },
  { label: 'Wishlist', icon: Heart, to: '/wishlist', color: 'from-pink-500 to-rose-600' },
  { label: 'Deals', icon: Flame, to: '/deals', color: 'from-red-500 to-orange-500' },
  { label: 'Orders', icon: Package, to: '/orders', color: 'from-emerald-500 to-teal-600' },
  { label: 'Nearby', icon: MapPin, to: '/stores', color: 'from-blue-500 to-cyan-500' },
];

export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <aside className="fixed right-4 bottom-24 z-40 hidden items-end flex-col gap-3 md:flex md:bottom-8" aria-label="Quick actions">
      {open && ACTIONS.map(({ label, icon: Icon, to, color }, index) => (
        <button
          key={label}
          type="button"
          onClick={() => { setOpen(false); navigate(to); }}
          className="group flex items-center gap-2.5"
          style={{ animation: `slide-up 0.3s cubic-bezier(0.16,1,0.3,1) ${index * 40}ms both` }}
        >
          <span className="rounded-pill bg-[#21165e]/90 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
          <span className={`inline-flex size-11 items-center justify-center rounded-full bg-gradient-to-br ${color} text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform group-hover:scale-110`}>
            <Icon className="size-5" />
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close quick actions' : 'Quick actions'}
        className={`inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7b54] to-[#e93483] text-white shadow-[0_12px_30px_rgba(233,52,131,0.45)] neon-btn transition-all duration-300 ${open ? 'rotate-45' : 'rotate-0'}`}
      >
        {open ? <X className="size-6" /> : <Zap className="size-6" />}
      </button>
    </aside>
  );
}
