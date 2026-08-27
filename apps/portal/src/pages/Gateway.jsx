import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Store, TrendingUp } from "lucide-react";
import Container from "../components/common/Container.jsx";
import AppLoader from "../components/common/AppLoader.jsx";
import { CONSUMER_APP_URL } from "../config/urls.js";

const PLATFORMS = [
  {
    key: "consumer",
    icon: Store,
    title: "Consumer",
    description:
      "Find products available at nearby local stores, compare prices and discover the best place to buy.",
    ctaLabel: "Explore Local Products",
    href: CONSUMER_APP_URL,
    external: true,
  },
  {
    key: "entrepreneur",
    icon: TrendingUp,
    title: "Entrepreneur",
    description:
      "Analyse local market opportunities, understand competition and plan your business financing before you invest.",
    ctaLabel: "Analyse a Business Opportunity",
    href: "/entrepreneur",
    external: false,
  },
];

function PlatformCard({ icon: Icon, title, description, ctaLabel, href, external }) {
  const cta = (
    <span className="mt-6 inline-flex items-center gap-1.5 text-meta font-bold text-primary">
      {ctaLabel}
      <ArrowUpRight className="size-3.5 transition-transform duration-200 ease-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
    </span>
  );

  const cardBody = (
    <>
      <span className="inline-flex size-12 items-center justify-center rounded-control bg-primary-soft text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-section text-ink">{title}</h2>
      <p className="mt-2 text-body text-ink-muted">{description}</p>
      {cta}
    </>
  );

  const className =
    "group flex h-full flex-col items-start rounded-panel border border-line bg-surface p-6 text-left shadow-subtle transition-[border-color,box-shadow,transform] duration-200 ease-brand hover:-translate-y-1 hover:border-primary/35 hover:shadow-float sm:p-8";

  if (external) {
    return (
      <a href={href} className={className}>
        {cardBody}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {cardBody}
    </Link>
  );
}

export default function Gateway() {
  const [loading, setLoading] = useState(true);

  if (loading) return <AppLoader onDone={() => setLoading(false)} />;

  return (
    <div className="kc-loader-content-in flex min-h-dvh flex-col justify-center py-14 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p
            className="inline-block font-sans text-[2rem] font-extrabold tracking-tight text-ink sm:text-[2.375rem]"
            aria-label="Kirana Connect"
          >
            Kirana{" "}
            <span className="bg-gradient-to-r from-[#7c3aed] via-[#e93483] to-[#ffd45e] bg-clip-text text-transparent">
              Connect
            </span>
          </p>
          <h1 className="mt-4 text-heading text-balance text-ink">Choose how you want to use Kirana Connect</h1>
          <p className="mt-3 text-body text-ink-muted">One platform, two ways in -- shop nearby, or plan your next business.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
          {PLATFORMS.map(({ key, ...platform }) => (
            <PlatformCard key={key} {...platform} />
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-md text-center text-meta text-ink-muted">
          Connecting local demand, local stores and local entrepreneurship.
        </p>
      </Container>
    </div>
  );
}
