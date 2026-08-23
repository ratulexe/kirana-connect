import { Link } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Skeleton from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { usePendingStores } from "../features/admin/useAdmin.js";
import { formatDate } from "../utils/format.js";

function ownerLabel(store) {
  return store.owner?.full_name || "No owner name";
}

export default function PendingStores() {
  const { data, isPending, isError, error } = usePendingStores();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert tone="error" title="Could not load pending stores">
        {error?.message ?? "Please try again."}
      </Alert>
    );
  }

  return (
    <div>
      <h1 className="text-heading text-ink">Store approvals</h1>
      <p className="mt-1 text-body text-ink-muted">
        Review submitted stores, verify legitimate shops, or reject unverified applications.
      </p>

      <div className="mt-6 divide-y divide-line-soft rounded-panel border border-line bg-surface">
        {data.length === 0 ? (
          <p className="p-6 text-body text-ink-muted">No pending store applications.</p>
        ) : (
          data.map((store) => (
            <article key={store.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-card text-ink">{store.name}</h2>
                  <StatusPill tone="warning">Pending</StatusPill>
                </div>
                <p className="mt-1 text-meta text-ink-muted">
                  {store.address_line_1}, {store.locality}, {store.city}, {store.state} {store.postal_code}
                </p>
                <p className="mt-1 text-meta text-ink-muted">
                  Owner: {ownerLabel(store)} · submitted {formatDate(store.created_at)}
                </p>
              </div>
              <Button as={Link} to={`/stores/${store.id}`} variant="secondary" size="sm">
                Review
              </Button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
