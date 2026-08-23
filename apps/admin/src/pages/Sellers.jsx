import Alert from "../components/Alert.jsx";
import Card from "../components/Card.jsx";
import Skeleton from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { useSellers } from "../features/admin/useAdmin.js";

export default function Sellers() {
  const { data, isPending, isError, error } = useSellers();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert tone="error" title="Could not load sellers">
        {error?.message ?? "Please try again."}
      </Alert>
    );
  }

  return (
    <div>
      <h1 className="text-heading text-ink">Sellers</h1>
      <p className="mt-1 text-body text-ink-muted">
        Read-only view of seller profiles and their stores.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {data.length === 0 ? (
          <Card className="p-6 text-body text-ink-muted">No seller profiles yet.</Card>
        ) : (
          data.map((seller) => (
            <Card key={seller.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-card text-ink">
                    {seller.full_name || "No seller name"}
                  </h2>
                  <p className="mt-1 text-meta text-ink-muted">{seller.email ?? "No email available"}</p>
                  <p className="mt-1 text-meta text-ink-muted">{seller.phone ?? "No phone"}</p>
                </div>
                <StatusPill tone="success">{seller.role}</StatusPill>
              </div>

              <div className="mt-4">
                <p className="text-meta font-semibold text-ink-muted">
                  Stores ({seller.stores.length})
                </p>
                {seller.stores.length === 0 ? (
                  <p className="mt-2 text-meta text-ink-muted">No stores owned.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {seller.stores.map((store) => (
                      <li key={store.id} className="rounded-control border border-line-soft px-3 py-2 text-meta">
                        <p className="font-semibold text-ink">{store.name}</p>
                        <p className="mt-0.5 text-ink-muted">
                          {store.is_verified ? "Verified" : "Unverified"} · {store.is_active ? "Active" : "Inactive"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
