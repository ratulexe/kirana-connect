import { Link } from 'react-router-dom';
import { Heart, Search, Trash2 } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import ProductImage from '../../components/common/ProductImage.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import { useWishlist } from '../../hooks/useWishlist.js';
import { useProductsByIds } from '../../hooks/useDiscovery.js';
import { formatPrice } from '../../utils/format.js';

export default function WishlistPage() {
  const { ids, remove } = useWishlist();
  const products = useProductsByIds(ids);
  const list = products.data ?? [];

  return (
    <div className="min-h-screen py-8">
      <Container>
        <div className="mb-8">
          <h1 className="text-heading text-ink flex items-center gap-3">
            <Heart className="size-8 text-pink-500 fill-current" />
            My Wishlist
          </h1>
          <p className="text-ink-muted mt-1">{ids.length} saved {ids.length === 1 ? 'item' : 'items'}</p>
        </div>

        {ids.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Heart className="size-16 text-ink-muted" />
            <p className="text-ink-muted mb-2">You haven't saved any items yet.</p>
            <Link to="/search" className="neon-btn rounded-pill bg-primary px-8 py-3 font-bold text-white">Discover Products</Link>
          </div>
        ) : products.isPending ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ids.map((id) => <Skeleton key={id} className="h-56 rounded-card" />)}
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((product) => (
              <li key={product.id} className="glass-card card-lift rounded-card p-4">
                <Link to={`/product/${product.slug}`} className="block">
                  <ProductImage src={product.image_url} name={product.name} size="lg" />
                  <p className="mt-3 font-bold text-ink text-sm line-clamp-2">{product.name}</p>
                  <p className="text-xs text-ink-muted">{product.category?.name}</p>
                  <p className="text-lg font-black text-primary mt-2">{formatPrice(product.price_from ?? product.mrp)}</p>
                </Link>
                <div className="mt-3 flex gap-2">
                  <Link to={`/product/${product.slug}`} className="flex-1 neon-btn rounded-pill bg-primary py-2 text-center text-xs font-bold text-white">
                    <Search className="inline size-3 mr-1" />Find
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="inline-flex size-9 items-center justify-center rounded-full border border-red-200 text-red-400 hover:bg-red-50 transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </div>
  );
}
