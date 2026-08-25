import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import NeonBadge from '../../components/common/NeonBadge.jsx';
import { useProductSearch } from '../../hooks/useDiscovery.js';
import Skeleton from '../../components/common/Skeleton.jsx';

const RANK_STYLES = { 1: 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white', 2: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white', 3: 'bg-gradient-to-br from-orange-400 to-amber-600 text-white' };

export default function TrendingPage() {
  const { data, isLoading } = useProductSearch({ limit: 10 });
  const products = data?.products || [];

  return (
    <div className="min-h-screen py-8">
      <Container>
        <div className="mb-8">
          <NeonBadge variant="trending" className="mb-3" />
          <h1 className="text-heading text-ink flex items-center gap-3">
            <Flame className="size-8 text-orange-500" />
            Trending Products
          </h1>
          <p className="text-ink-muted mt-1">What your neighbours are searching for right now</p>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
               <div key={i} className="glass-card flex items-center gap-4 rounded-card p-4"><Skeleton className="size-10 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-1/3 mb-1" /><Skeleton className="h-3 w-1/4" /></div></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product, i) => {
              const rank = i + 1;
              return (
                <Link key={product.id} to={`/product/${product.slug}`} className="glass-card card-lift group flex items-center gap-4 rounded-card p-4 hover:border-primary/30">
                  <div className={`shrink-0 size-10 rounded-full flex items-center justify-center font-black text-lg ${RANK_STYLES[rank] || 'bg-surface-sunken text-ink-muted'}`}>
                    {rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink truncate">{product.name}</p>
                    <p className="text-xs text-ink-muted">{product.category_name}</p>
                  </div>
                  <span className="hidden shrink-0 rounded-pill bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary sm:inline">Explore item</span>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
