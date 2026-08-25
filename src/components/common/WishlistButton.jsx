import { Heart } from 'lucide-react';
import { useCallback, useState } from 'react';

const STORAGE_KEY = 'kirana-wishlist';
const getWishlist = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };

export default function WishlistButton({ productId, className = '' }) {
  const [saved, setSaved] = useState(() => getWishlist().includes(productId));
  const [bursting, setBursting] = useState(false);

  const toggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const current = getWishlist();
    const next = saved ? current.filter((id) => id !== productId) : [...current, productId];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setSaved(!saved);
    if (!saved) {
      setBursting(true);
      setTimeout(() => setBursting(false), 600);
    }
  }, [saved, productId]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={saved}
      className={`inline-flex size-9 items-center justify-center rounded-full border transition-all duration-200 ${
        saved ? 'border-pink-200 bg-pink-50 text-pink-500' : 'border-line bg-white/80 text-ink-muted hover:border-pink-300 hover:text-pink-400'
      } ${className}`}
    >
      <Heart className={`size-4 transition-all duration-300 ${saved ? 'fill-current' : ''} ${bursting ? 'animate-bounce-in' : ''}`} strokeWidth={1.8} />
    </button>
  );
}
