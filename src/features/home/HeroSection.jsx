import { ArrowRight, IndianRupee, MapPin, Search, Sparkles, Store, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../../components/common/Container.jsx";
import { useEntranceAnimation } from "../../animations/useEntranceAnimation.js";
import SearchBar from "../../components/common/SearchBar.jsx";

const PROMISES = [
  { icon: Store, label: "Real shelf stock" },
  { icon: IndianRupee, label: "Shop-by-shop prices" },
  { icon: MapPin, label: "Walking distance" },
];

const SEARCH_TERMS = ['milk', 'atta', 'chips', 'cold drinks', 'bread', 'dahi', 'tea'];

export default function HeroSection() {
  const heroRef = useEntranceAnimation();
  const navigate = useNavigate();
  const [termIdx, setTermIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTermIdx((prev) => (prev + 1) % SEARCH_TERMS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-white text-ink border-b border-line">
      <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-[0.03]" />
      <div aria-hidden="true" className="absolute -left-20 top-16 size-80 rounded-full bg-primary opacity-[0.08] blur-3xl" />
      <div aria-hidden="true" className="absolute -right-16 -top-20 size-96 rounded-full bg-pink-500 opacity-[0.05] blur-3xl" />
      <div aria-hidden="true" className="absolute left-1/3 bottom-0 size-72 rounded-full bg-yellow-400 opacity-[0.1] blur-3xl" />
      <Container className="relative py-14 sm:py-20 lg:py-24">
        <div ref={heroRef} className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
          <div className="text-center lg:text-left">
          <p
            data-animate
            className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface-sunken px-3 py-1.5 text-meta font-semibold text-primary"
          >
            <Sparkles aria-hidden="true" className="size-3.5 text-primary" />
            Your neighbourhood, now searchable
          </p>

          <h1 data-animate className="mt-6 text-display text-balance text-ink">
            Your local market,
            <span className="text-primary gradient-text"> lit up.</span>
          </h1>

          <p
            data-animate
            className="mx-auto mt-5 max-w-xl text-pretty text-body text-ink-muted sm:text-[1.0625rem] lg:mx-0"
          >
            Search any everyday item and see which kirana stores near you actually stock it
            today, with each shop&apos;s own price side by side. Then simply walk in.
          </p>

          <div data-animate className="mx-auto mt-7 max-w-xl lg:mx-0">
            <SearchBar size="lg" showSubmit={false} placeholder={`Search for ${SEARCH_TERMS[termIdx]}...`} onSubmit={(term) => navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search")} className="border border-line bg-white shadow-float" />
            <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              {["Milk", "Chips", "Atta", "Cold drinks"].map((item) => <button key={item} type="button" onClick={() => navigate(`/search?q=${item}`)} className="rounded-pill border border-line bg-surface px-3 py-1.5 text-meta font-semibold text-ink-muted transition hover:-translate-y-0.5 hover:bg-primary-soft hover:text-primary hover:border-primary/30">{item}</button>)}
            </div>
          </div>

          <ul
            data-animate
            className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 lg:justify-start"
          >
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 text-meta text-ink-muted">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
          
          <div className="mt-4 inline-flex items-center gap-2 rounded-pill border border-line bg-surface-sunken px-4 py-2 text-sm">
            <span className="size-2 rounded-full bg-green-500 live-dot" />
            <span className="text-ink-muted"><strong className="text-ink">1,247</strong> products searched today</span>
          </div>

          </div>
          <div data-animate className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="shine-sweep hologram relative rounded-panel border border-line bg-gradient-to-br from-white to-slate-50 p-6 shadow-float sm:p-8">
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft text-primary px-3 py-1.5 text-meta font-bold"><Zap className="size-3.5 fill-current" /> LOCAL DROP</span>
              <p className="mt-8 text-4xl font-bold tracking-tight text-ink">Find it.<br />Walk in. <span className="text-primary">Win the day.</span></p>
              <div className="mt-8 flex items-center justify-between rounded-card bg-surface-sunken p-3 border border-line"><span className="inline-flex size-11 items-center justify-center rounded-control bg-primary text-white"><Search className="size-5" /></span><span className="text-meta font-semibold text-ink-muted">Thousands of everyday finds</span><ArrowRight className="size-5 text-ink-muted" /></div>
            </div>
            <div className="float-orbit absolute top-1/2 -left-8 inline-flex size-11 items-center justify-center rounded-2xl bg-white text-primary shadow-lg text-xl border border-line/50">🍞</div>
            <div className="float-orbit absolute -left-6 top-10 inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg"><IndianRupee className="size-6" /></div>
            <div className="float-orbit-delayed absolute -right-5 -bottom-5 inline-flex size-14 items-center justify-center rounded-2xl bg-white text-primary shadow-lg border border-line/50"><Store className="size-6" /></div>
          </div>
        </div>
      </Container>
    </section>
  );
}
