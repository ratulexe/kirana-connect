import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, Trash2 } from 'lucide-react';
import Container from '../../components/common/Container.jsx';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]); // Real DB integration coming soon
  const remove = (id) => setWishlist(prev => prev.filter(p => p.id !== id));
  
  return (
    <div className="min-h-screen py-8">
      <Container>
        <div className="mb-8"><h1 className="text-heading text-ink flex items-center gap-3"><Heart className="size-8 text-pink-500 fill-current" />My Wishlist</h1><p className="text-ink-muted mt-1">{wishlist.length} saved items</p></div>
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
             <Heart className="size-16 text-ink-muted" />
             <p className="text-ink-muted mb-2">You haven't saved any items yet.</p>
             <Link to="/search" className="neon-btn rounded-pill bg-primary px-8 py-3 font-bold text-white">Discover Products</Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {wishlist.map(product => (<li key={product.id} className="glass-card card-lift rounded-card p-4"><div className="text-4xl text-center mb-3">{product.emoji}</div><p className="font-bold text-ink text-sm">{product.name}</p><p className="text-xs text-ink-muted">{product.category}</p><p className="text-lg font-black text-primary mt-2">₹{product.price}</p><div className="mt-3 flex gap-2"><Link to={`/search?q=${encodeURIComponent(product.name)}`} className="flex-1 neon-btn rounded-pill bg-primary py-2 text-center text-xs font-bold text-white"><Search className="inline size-3 mr-1" />Find</Link><button onClick={() => remove(product.id)} className="inline-flex size-9 items-center justify-center rounded-full border border-red-200 text-red-400 hover:bg-red-50 transition"><Trash2 className="size-4" /></button></div></li>))}
          </ul>
        )}
      </Container>
    </div>
  );
}
