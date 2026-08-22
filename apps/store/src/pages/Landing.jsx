import { Link } from "react-router-dom";
import { ArrowRight, MapPin, PackageSearch, Store, TrendingUp } from "lucide-react";
import Container from "../components/Container.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../auth/useAuth.js";
import { useEntranceAnimation } from "../animations/useEntranceAnimation.js";

const POINTS = [
  {
    icon: PackageSearch,
    title: "Customers find what you stock",
    body: "When someone nearby searches for an item you carry, your store appears in the results.",
  },
  {
    icon: TrendingUp,
    title: "Your prices, shown as yours",
    body: "You set your own price for every product. Customers compare shops and see exactly what you charge.",
  },
  {
    icon: MapPin,
    title: "Foot traffic, not deliveries",
    body: "Kirana Connect sends people to your counter. There are no orders to pack and nothing to deliver.",
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const heroRef = useEntranceAnimation("landing");

  return (
    <>
      <section className="border-b border-line-soft bg-surface">
        <Container className="py-14 sm:py-20">
          <div ref={heroRef} className="max-w-2xl">
            <p
              data-animate
              className="inline-flex items-center gap-2 rounded-pill border border-line bg-canvas px-3 py-1.5 text-meta font-semibold text-ink-soft"
            >
              <Store className="size-3.5 text-primary" aria-hidden="true" />
              For shop owners
            </p>

            <h1 data-animate className="mt-5 text-display text-balance text-ink">
              Let your neighbourhood
              <span className="text-primary"> find your shelf.</span>
            </h1>

            <p data-animate className="mt-4 max-w-xl text-pretty text-body text-ink-soft">
              List your store on Kirana Connect so nearby customers can see what you stock,
              what you charge and how far away you are, then walk in and buy it.
            </p>

            <div data-animate className="mt-7 flex flex-wrap items-center gap-3">
              <Button as={Link} to={isAuthenticated ? "/onboarding" : "/register"} size="lg">
                {isAuthenticated ? "Continue registration" : "Register your store"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              {!isAuthenticated ? (
                <Button as={Link} to="/login" variant="secondary" size="lg">
                  Sign in
                </Button>
              ) : null}
            </div>

            <p data-animate className="mt-4 text-meta text-ink-muted">
              Free to list. Your store goes live once our team verifies it.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-14 sm:py-16">
        <h2 className="text-heading text-ink">What listing gets you</h2>

        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-card border border-line bg-surface p-5 transition-[border-color] duration-200 ease-brand hover:border-primary/30"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-control bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-card text-ink">{title}</h3>
              <p className="mt-1.5 text-body text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-2xl text-meta text-ink-muted">
          Kirana Connect is a discovery service. It does not process orders, take payments
          or arrange delivery, and it makes no promise about how many customers will visit.
        </p>
      </Container>
    </>
  );
}
