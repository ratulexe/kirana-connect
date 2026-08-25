import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, Building2, Layers3, Package, Sparkles, Store, Users } from "lucide-react";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Skeleton from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { useDashboard } from "../features/admin/useAdmin.js";
import { formatDate } from "../utils/format.js";

const METRICS = [
  { key: "pendingStores", label: "Pending approvals", icon: BadgeCheck },
  { key: "verifiedStores", label: "Verified stores", icon: Store },
  { key: "activeStores", label: "Active stores", icon: Building2 },
  { key: "sellers", label: "Sellers", icon: Users },
  { key: "products", label: "Products", icon: Package },
  { key: "inventoryLines", label: "Inventory lines", icon: Layers3 },
];

export default function Dashboard() {
  const { data, isPending, isError, error } = useDashboard();

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {METRICS.map((metric) => (
            <Skeleton key={metric.key} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert tone="error" title="Could not load dashboard">
        {error?.message ?? "Please try again."}
      </Alert>
    );
  }

  return (
    <div>
      <div className="admin-glow relative overflow-hidden rounded-panel bg-gradient-to-br from-[#352176] via-[#5138dd] to-[#8f5aea] p-6 text-white sm:p-8">
        <div aria-hidden="true" className="absolute -right-10 -top-14 size-52 rounded-full border-[24px] border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-meta font-bold tracking-[.14em] text-[#ffd45e] uppercase">Control centre</p>
          <h1 className="mt-2 text-heading text-white">Grow the neighbourhood network.</h1>
          <p className="mt-1 max-w-xl text-body text-white/70">
            Live operational signals for the Kirana Connect marketplace.
          </p>
        </div>
        <Button as={Link} to="/stores/pending" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
          Review approvals
          <ArrowUpRight className="size-4" />
        </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {METRICS.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="group p-4 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-meta font-semibold text-ink-muted">{label}</p>
                <p className="mt-2 text-[2rem] font-bold leading-none text-ink tabular-nums">
                  {data.metrics[key]}
                </p>
              </div>
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-6 grid gap-3 md:grid-cols-3" aria-label="Admin quick actions">
        {[{ to: "/stores/pending", label: "Approve local stores", note: "Keep quality high", icon: BadgeCheck, tone: "from-[#ffcb56] to-[#ff8c61]" }, { to: "/products", label: "Curate the catalogue", note: "Build better discovery", icon: Package, tone: "from-[#593ce0] to-[#9264ea]" }, { to: "/categories", label: "Shape the aisles", note: "Organise every search", icon: Layers3, tone: "from-[#e93483] to-[#f56a79]" }].map(({ to, label, note, icon: Icon, tone }) => <Link key={to} to={to} className={`group relative overflow-hidden rounded-card bg-gradient-to-br ${tone} p-5 text-white shadow-[0_12px_28px_rgba(62,42,150,.16)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(62,42,150,.28)]`}><span className="inline-flex size-10 items-center justify-center rounded-2xl bg-white/18 transition group-hover:rotate-6 group-hover:scale-110"><Icon className="size-5" /></span><p className="mt-8 text-card">{label}</p><p className="mt-1 text-meta text-white/75">{note}</p><ArrowUpRight className="absolute right-5 bottom-5 size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>)}
      </section>

      <section className="mt-8" aria-labelledby="latest-pending">
        <div className="flex items-center justify-between gap-3">
          <h2 id="latest-pending" className="text-section text-ink">
            Latest pending stores
          </h2>
          <Button as={Link} to="/stores/pending" variant="ghost" size="sm">
            View all
          </Button>
        </div>

        <div className="mt-3 divide-y divide-line-soft rounded-panel border border-line bg-surface shadow-subtle">
          {data.latest_pending_stores.length === 0 ? (
            <p className="p-5 text-body text-ink-muted">No stores are waiting for approval.</p>
          ) : (
            data.latest_pending_stores.map((store) => (
              <div key={store.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-card text-ink">{store.name}</p>
                  <p className="mt-1 text-meta text-ink-muted">
                    {store.locality}, {store.city} · submitted {formatDate(store.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone="warning">Pending</StatusPill>
                  <Button as={Link} to={`/stores/${store.id}`} variant="secondary" size="sm">
                    Review
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
