import { Link } from "react-router-dom";
import { BadgeCheck, Building2, Layers3, Package, Store, Users } from "lucide-react";
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading text-ink">Dashboard</h1>
          <p className="mt-1 text-body text-ink-muted">
            Live operational counts from the shared Kirana Connect database.
          </p>
        </div>
        <Button as={Link} to="/stores/pending" variant="secondary">
          Review approvals
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {METRICS.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-meta font-semibold text-ink-muted">{label}</p>
                <p className="mt-2 text-[2rem] font-bold leading-none text-ink tabular-nums">
                  {data.metrics[key]}
                </p>
              </div>
              <span className="inline-flex size-10 items-center justify-center rounded-pill bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-8" aria-labelledby="latest-pending">
        <div className="flex items-center justify-between gap-3">
          <h2 id="latest-pending" className="text-section text-ink">
            Latest pending stores
          </h2>
          <Button as={Link} to="/stores/pending" variant="ghost" size="sm">
            View all
          </Button>
        </div>

        <div className="mt-3 divide-y divide-line-soft rounded-panel border border-line bg-surface">
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
