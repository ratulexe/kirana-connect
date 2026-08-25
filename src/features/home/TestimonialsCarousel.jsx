import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import { useRevealOnScroll } from '../../animations/useRevealOnScroll.js';
import { useEffect, useState } from 'react';

const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Bengaluru', rating: 5, text: 'Finally found which shop near me has the Amul butter I need! Saved me so much guesswork on busy mornings.', gradient: 'from-pink-400 to-violet-500' },
  { name: 'Rahul Mehta', city: 'Mumbai', rating: 5, text: 'Compared prices across 4 kirana stores before stepping out. Saved ₹45 on my weekly grocery run!', gradient: 'from-orange-400 to-pink-500' },
  { name: 'Anita Nair', city: 'Chennai', rating: 5, text: 'The search is lightning fast. Typed "atta" and got results from 6 nearby stores instantly.', gradient: 'from-teal-400 to-blue-500' },
  { name: 'Deepak Kumar', city: 'Delhi', rating: 5, text: 'My neighbourhood kirana store got more customers after listing on Kirana Connect. This is the future!', gradient: 'from-yellow-400 to-orange-500' },
  { name: 'Sneha Patel', city: 'Ahmedabad', rating: 5, text: 'Love how I can browse by mood — found exactly what I needed for chai time without wandering around.', gradient: 'from-green-400 to-teal-500' },
  { name: 'Arjun Singh', city: 'Pune', rating: 5, text: 'The flash deals are incredible. Grabbed Maggi noodles 24% off before the deal ended. Brilliant!', gradient: 'from-indigo-400 to-purple-500' },
];

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export default function TestimonialsCarousel() {
  const sectionRef = useRevealOnScroll();
  const [active, setActive] = useState(0);
  const move = (dir) => setActive((i) => (i + dir + TESTIMONIALS.length) % TESTIMONIALS.length);

  useEffect(() => {
    const id = setInterval(() => move(1), 4500);
    return () => clearInterval(id);
  }, [active]);

  const t = TESTIMONIALS[active];

  return (
    <section ref={sectionRef} className="py-14 sm:py-20 bg-gradient-to-b from-[#f5f1ff] via-[#ede8ff] to-[#f5f1ff]" aria-label="Customer testimonials">
      <Container>
        <div className="text-center mb-10">
          <p className="text-meta font-bold uppercase tracking-widest text-primary">What customers say</p>
          <h2 className="mt-2 text-heading text-ink">Loved by <span className="gradient-text">neighbourhoods</span></h2>
        </div>
        <div className="relative mx-auto max-w-2xl">
          <div key={active} className="glass-card rounded-panel p-8 text-center animate-slide-up">
            <div className="flex justify-center gap-1 mb-4">
              {Array.from({length: t.rating}).map((_,i) => <Star key={i} className="size-5 text-[#ffd45e] fill-current" />)}
            </div>
            <p className="text-body text-ink italic leading-relaxed">“{t.text}”</p>
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className={`size-12 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>{initials(t.name)}</div>
              <div>
                <p className="font-bold text-ink">{t.name}</p>
                <p className="text-xs text-ink-muted">{t.city}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button onClick={() => move(-1)} aria-label="Previous" className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:border-primary hover:text-primary transition">
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setActive(i)} aria-current={i === active ? 'true' : undefined}
                  className={`h-2 rounded-pill transition-all ${i === active ? 'w-6 bg-primary' : 'w-2 bg-line hover:bg-ink-muted'}`} />
              ))}
            </div>
            <button onClick={() => move(1)} aria-label="Next" className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:border-primary hover:text-primary transition">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
