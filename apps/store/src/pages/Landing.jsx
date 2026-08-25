import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, MapPin, PackageSearch, Sparkles, Store, TrendingUp, Zap } from "lucide-react";
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
      <section className="relative isolate overflow-hidden bg-[#21165e] text-white">
        <div aria-hidden="true" className="portal-grid absolute inset-0 opacity-40" />
        <div aria-hidden="true" className="absolute -left-20 top-8 size-72 rounded-full bg-[#ff7e5d]/60 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-24 -top-16 size-80 rounded-full bg-[#8265ff]/70 blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <div ref={heroRef} className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div className="max-w-2xl">
            <p
              data-animate
              className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3 py-1.5 text-meta font-semibold text-white/90 backdrop-blur"
            >
              <Sparkles className="size-3.5 text-[#ffd45e]" aria-hidden="true" />
              The local commerce network
            </p>

            <h1 data-animate className="mt-5 text-display text-balance text-white">
              Turn your shelf into a
              <span className="text-[#ffd45e]"> local landmark.</span>
            </h1>

            <p data-animate className="mt-4 max-w-xl text-pretty text-body text-white/75">
              List your store on Kirana Connect so nearby customers can see what you stock,
              what you charge and how far away you are, then walk in and buy it.
            </p>

            <div data-animate className="mt-7 flex flex-wrap items-center gap-3">
              <Button as={Link} to={isAuthenticated ? "/onboarding" : "/register"} size="lg" className="bg-[#ffd45e] text-[#33216e] hover:bg-[#ffe586]">
                {isAuthenticated ? "Continue registration" : "Register your store"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              {!isAuthenticated ? (
                <Button as={Link} to="/login" variant="secondary" size="lg" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  Sign in
                </Button>
              ) : null}
            </div>

            <p data-animate className="mt-4 text-meta text-white/65">
              Free to list. Your store goes live once our team verifies it.
            </p>
          </div>
          <div data-animate className="relative mx-auto w-full max-w-sm">
            <div className="relative overflow-hidden rounded-panel border border-white/20 bg-gradient-to-br from-[#ff7e5d] to-[#e93483] p-6 shadow-[0_24px_70px_rgba(5,2,36,.42)] sm:p-8">
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/20 px-3 py-1.5 text-meta font-bold"><Zap className="size-3.5 fill-current" /> SHELF POWERED</span>
              <p className="mt-8 text-3xl font-bold tracking-tight">Show what’s real.<br /><span className="text-[#ffec9d]">Bring people in.</span></p>
              <div className="mt-8 rounded-card bg-[#21165e]/25 p-3 text-meta font-semibold backdrop-blur-sm"><BadgeCheck className="mr-2 inline size-4 text-[#ffec9d]" /> Your prices. Your store. Your control.</div>
            </div>
            <span aria-hidden="true" className="portal-float absolute -left-6 top-12 inline-flex size-12 items-center justify-center rounded-2xl bg-[#ffd45e] text-[#443080] shadow-lg"><TrendingUp className="size-6" /></span>
            <span aria-hidden="true" className="portal-float-slow absolute -right-5 -bottom-5 inline-flex size-14 items-center justify-center rounded-2xl bg-white text-primary shadow-lg"><Store className="size-6" /></span>
          </div>
          </div>
        </Container>
      </section>

      <Container className="py-14 sm:py-20">
        <p className="text-meta font-bold tracking-[.14em] text-[#e93483] uppercase">Everyday growth, beautifully simple</p>
        <h2 className="mt-2 text-heading text-ink">What listing gets you</h2>

        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="group rounded-card border border-line bg-surface p-5 transition-[border-color,box-shadow,transform] duration-300 ease-brand hover:-translate-y-1 hover:border-primary/30 hover:shadow-float"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-control bg-primary-soft text-primary transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
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

      <Container className="pb-14 sm:pb-20">
        <section className="relative overflow-hidden rounded-panel bg-[#21165e] p-6 text-white shadow-[0_20px_50px_rgba(41,24,110,.2)] sm:p-8" aria-label="Store listing benefits">
          <div aria-hidden="true" className="absolute -right-16 -top-20 size-64 rounded-full border-[30px] border-[#ffd45e]/18" />
          <p className="relative text-meta font-bold tracking-[.14em] text-[#ffd45e] uppercase">The shelf-to-street signal</p>
          <div className="relative mt-5 grid gap-5 md:grid-cols-3"><div><p className="text-3xl font-bold">01</p><p className="mt-2 text-card">List your live shelf</p><p className="mt-1 text-meta text-white/65">Make your everyday selection discoverable.</p></div><div><p className="text-3xl font-bold">02</p><p className="mt-2 text-card">Own your price</p><p className="mt-1 text-meta text-white/65">Keep your store’s pricing clear and current.</p></div><div><p className="text-3xl font-bold">03</p><p className="mt-2 text-card">Welcome local footfall</p><p className="mt-1 text-meta text-white/65">Turn searches into familiar faces at the counter.</p></div></div>
        </section>
      </Container>
    </>
  );
}
