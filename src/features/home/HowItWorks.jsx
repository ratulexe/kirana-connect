import { Navigation, Search, Store } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import SectionHeader from "../../components/common/SectionHeader.jsx";
import { useRevealOnScroll } from "../../animations/useRevealOnScroll.js";

const STEPS = [
  {
    icon: Search,
    title: "Search the item",
    body: "Type what you need. Kirana Connect looks across the catalogue every nearby shop stocks from.",
    style: "from-amber-400 to-orange-500",
  },
  {
    icon: Store,
    title: "Compare the shops",
    body: "See which stores have it right now, what each one charges, and how much you save against MRP.",
    style: "from-indigo-500 to-violet-600",
  },
  {
    icon: Navigation,
    title: "Walk in and buy",
    body: "Pick a shop, get directions, and pay at the counter. No cart, no waiting for a delivery slot.",
    style: "from-emerald-400 to-teal-600",
  },
];

export default function HowItWorks() {
  const sectionRef = useRevealOnScroll();

  return (
    <section ref={sectionRef} aria-labelledby="how-it-works-heading">
      <Container className="pt-14 sm:pt-20">
        <SectionHeader
          id="how-it-works-heading"
          title="How it works"
          description="Three steps, and the last one happens at the shop counter."
        />

        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body, style }, index) => (
            <li
              key={title}
              className={`card-lift group relative isolate overflow-hidden rounded-card bg-gradient-to-br ${style} p-6 text-white shadow-[0_16px_32px_rgba(53,38,126,.18)] transition duration-300 hover:-translate-y-1`}
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.22)_1px,transparent_1px)] bg-size-[10px_10px] opacity-50"
              />
              <div className="relative z-10 flex items-center gap-4">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-meta font-semibold tabular-nums text-white/80">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="relative z-10 mt-4 text-card text-white">{title}</h3>
              <p className="relative z-10 mt-1.5 text-body text-white/85">{body}</p>
              <span
                aria-hidden="true"
                className="absolute -right-6 -bottom-8 z-0 size-28 rounded-full border-[16px] border-white/15"
              />
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
