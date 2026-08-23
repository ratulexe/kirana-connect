import { IndianRupee, MapPin, Store } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import { useEntranceAnimation } from "../../animations/useEntranceAnimation.js";

const PROMISES = [
  { icon: Store, label: "Real shelf stock" },
  { icon: IndianRupee, label: "Shop-by-shop prices" },
  { icon: MapPin, label: "Walking distance" },
];

export default function HeroSection() {
  const heroRef = useEntranceAnimation();

  return (
    <section className="relative overflow-hidden border-b border-line-soft bg-surface">
      {/* One soft wash of brand colour, no floating blobs or heavy gradients. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-primary-soft/60 blur-3xl"
      />

      <Container className="relative py-12 sm:py-16 lg:py-20">
        <div ref={heroRef} className="mx-auto max-w-3xl text-center">
          <p
            data-animate
            className="inline-flex items-center gap-2 rounded-pill border border-line bg-canvas px-3 py-1.5 text-meta font-semibold text-ink-soft"
          >
            <span aria-hidden="true" className="size-1.5 rounded-pill bg-accent" />
            No cart. No delivery. Just your neighbourhood shops.
          </p>

          <h1 data-animate className="mt-6 text-display text-balance text-ink">
            Know which shop has it,
            <span className="text-primary"> and what it costs.</span>
          </h1>

          <p
            data-animate
            className="mx-auto mt-5 max-w-xl text-pretty text-body text-ink-soft sm:text-[1.0625rem]"
          >
            Search any everyday item and see which kirana stores near you actually stock it
            today, with each shop&apos;s own price side by side. Then simply walk in.
          </p>

          <ul
            data-animate
            className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5"
          >
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 text-meta text-ink-muted">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
