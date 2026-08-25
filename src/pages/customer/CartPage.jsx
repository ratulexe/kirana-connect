import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Container from '../../components/common/Container.jsx';

export default function CartPage() {
  const [items, setItems] = useState([]); // Real DB integration coming soon
  const updateQty = (id, delta) => setItems(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter(item => item.qty > 0));
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const savings = Math.round(total * 0.15);
  
  return (
    <div className="min-h-screen py-8">
      <Container>
        <div className="mb-8 flex items-center gap-4">
          <Link to="/" className="neon-btn inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:border-primary hover:text-primary"><ArrowLeft className="size-5" /></Link>
          <div><h1 className="text-heading text-ink">My Cart</h1><p className="text-sm text-ink-muted">{items.length} items</p></div>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4"><ShoppingCart className="size-16 text-ink-muted opacity-50" /><h2 className="text-section text-ink">Your cart is empty</h2><Link to="/" className="neon-btn rounded-pill bg-primary px-8 py-3 font-bold text-white">Browse Products</Link></div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              {items.map(item => (
                <div key={item.id} className="glass-card flex items-center gap-4 rounded-card p-4">
                  <div className="text-3xl shrink-0">{item.emoji}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-ink">{item.name}</p><p className="text-xs text-ink-muted">from {item.store}</p><p className="text-sm font-bold text-primary">₹{item.price} each</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="neon-btn inline-flex size-8 items-center justify-center rounded-full border border-line hover:border-primary"><Minus className="size-3.5" /></button>
                    <span className="w-8 text-center font-bold tabular-nums">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="neon-btn inline-flex size-8 items-center justify-center rounded-full bg-primary text-white"><Plus className="size-3.5" /></button>
                  </div>
                  <div className="text-right shrink-0"><p className="font-bold text-ink">₹{item.price * item.qty}</p><button onClick={() => updateQty(item.id, -item.qty)} className="mt-1 text-red-400 hover:text-red-600"><Trash2 className="size-3.5" /></button></div>
                </div>
              ))}
            </div>
            <div>
              <div className="glass-card rounded-card p-6 sticky top-20">
                <h2 className="text-section text-ink mb-4">Order Summary</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd className="font-semibold">₹{total}</dd></div>
                  <div className="flex justify-between text-green-600"><dt>You save</dt><dd className="font-bold">₹{savings}</dd></div>
                </dl>
                <div className="mt-4 border-t border-line pt-4 flex justify-between"><span className="font-bold text-ink">Total</span><span className="text-2xl font-black text-primary">₹{total}</span></div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 rounded-card bg-green-50 p-3 text-xs"><Package className="size-4 text-green-600" /><span className="text-green-700 font-semibold">Walk in to your chosen store</span></div>
                  <Link to="/stores" className="neon-btn block w-full rounded-pill bg-primary py-3.5 text-center font-bold text-white neon-glow-indigo">Find Nearest Store →</Link>
                  <Link to="/search" className="block w-full rounded-pill border border-line py-3 text-center text-sm font-semibold text-ink-muted hover:border-primary hover:text-primary transition">Continue Shopping</Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
