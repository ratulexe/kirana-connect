import { ArrowLeft, ArrowRight, MapPin, ScanSearch, Sparkles, Store } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Container from "../../components/common/Container.jsx";
import gsap from "gsap";

const RADAR = [
  { eyebrow: "Morning map", title: "The breakfast run, made brighter.", text: "Milk, bread, tea and the small things that make a day begin well.", query: "milk", icon: Sparkles, gradient: "from-[#ffcf57] via-[#ffad62] to-[#fb6e72]" },
  { eyebrow: "Local radar", title: "See the shelves around you light up.", text: "Search a staple, compare nearby options and choose your own neighbourhood stop.", query: "atta", icon: MapPin, gradient: "from-[#533be0] via-[#7756ea] to-[#bd64e5]" },
  { eyebrow: "Little wins", title: "Find what you want before you wander.", text: "A clearer local shopping trip starts with one simple search.", query: "biscuits", icon: Store, gradient: "from-[#e93483] via-[#ef4e7d] to-[#ff825b]" },
];

export default function NeighbourhoodRadar() {
  const [active, setActive] = useState(0);
  const contentRef = useRef(null);
  const story = RADAR[active];
  const Icon = story.icon;
  const move = (direction) => setActive((index) => (index + direction + RADAR.length) % RADAR.length);

  useEffect(() => {
    gsap.fromTo(contentRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
  }, [active]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % RADAR.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-14 sm:py-20" aria-label="Kirana Connect local radar">
      <Container>
        <div className="gloss-panel overflow-hidden rounded-panel p-3 sm:p-4">
          <div className={`relative hologram min-h-[22rem] overflow-hidden rounded-card bg-gradient-to-br ${story.gradient} p-6 text-white transition-colors duration-500 sm:min-h-[25rem] sm:p-10`}>
            <div aria-hidden="true" className="absolute -right-10 -top-14 size-60 rounded-full border-[28px] border-white/14" />
            <div aria-hidden="true" className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-[#21165e]/15 blur-3xl" />
            <div className="relative flex h-full min-h-[18rem] flex-col justify-between">
              <div className="flex items-start justify-between gap-6"><span className="inline-flex items-center gap-2 rounded-pill bg-white/16 px-3 py-1.5 text-meta font-bold tracking-wide backdrop-blur"><Icon className="size-3.5" /> {story.eyebrow}</span><span className="text-meta font-bold text-white/70">0{active + 1} / 0{RADAR.length}</span></div>
              <div ref={contentRef} className="max-w-xl"><h2 className="text-heading text-white">{story.title}</h2><p className="mt-3 max-w-lg text-body text-white/76">{story.text}</p><Link to={`/search?q=${encodeURIComponent(story.query)}`} className="mt-6 inline-flex items-center gap-2 rounded-pill bg-white px-5 py-3 text-meta font-bold text-[#382373] shadow-lg transition hover:scale-105 neon-btn">Explore {story.query}<ScanSearch className="size-4" /></Link></div>
              <div className="flex items-center justify-between gap-4"><div className="flex gap-2">{RADAR.map((item, index) => <button key={item.title} type="button" onClick={() => setActive(index)} aria-label={`Show ${item.eyebrow}`} aria-current={index === active ? "true" : undefined} className={`h-2.5 rounded-pill transition-all ${index === active ? "w-8 bg-white neon-glow-yellow" : "w-2.5 bg-white/35 hover:bg-white/65"}`} />)}</div><div className="flex gap-2"><button type="button" onClick={() => move(-1)} aria-label="Previous story" className="inline-flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/12 transition hover:bg-white/25"><ArrowLeft className="size-4" /></button><button type="button" onClick={() => move(1)} aria-label="Next story" className="inline-flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/12 transition hover:bg-white/25"><ArrowRight className="size-4" /></button></div></div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
