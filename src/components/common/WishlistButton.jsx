import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useWishlist } from '../../hooks/useWishlist.js';

export default function WishlistButton({ productId, className = '' }) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(productId);
  const [bursting, setBursting] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
    if (!saved) {
      setBursting(true);
      setTimeout(() => setBursting(false), 600);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
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
