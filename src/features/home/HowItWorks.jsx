import { Navigation, Search, Store } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import SectionHeader from "../../components/common/SectionHeader.jsx";
import { useRevealOnScroll } from "../../animations/useRevealOnScroll.js";

const STEPS = [
  {
    icon: Search,
    title: "Search the item",
    body: "Type what you need. Kirana Connect looks across the catalogue every nearby shop stocks from.",
  },
  {
    icon: Store,
    title: "Compare the shops",
    body: "See which stores have it right now, what each one charges, and how much you save against MRP.",
  },
  {
    icon: Navigation,
    title: "Walk in and buy",
    body: "Pick a shop, get directions, and pay at the counter. No cart, no waiting for a delivery slot.",
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
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li
              key={title}
              className="glass-card card-lift group relative overflow-hidden rounded-card p-6 transition-[border-color] duration-200 ease-brand hover:border-primary/30"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex size-14 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-spin-slow border-dashed" />
                  <span className="relative inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#7c3aed] text-white transition-transform duration-200 group-hover:scale-110">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <span className="text-meta font-semibold tabular-nums text-ink-muted">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-card text-ink">{title}</h3>
              <p className="mt-1.5 text-body text-ink-muted">{body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
