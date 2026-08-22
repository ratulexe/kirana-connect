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
              className="rounded-card border border-line bg-surface p-6 transition-[border-color,box-shadow] duration-200 ease-brand hover:border-primary/30 hover:shadow-subtle"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-control bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
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
