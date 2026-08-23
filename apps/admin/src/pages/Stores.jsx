import { Link } from "react-router-dom";
import { useState } from "react";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Skeleton from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { useStores, useUpdateStore } from "../features/admin/useAdmin.js";

function boolValue(value) {
  if (value === "any") return "";
  return value;
}

function ownerLabel(store) {
  return store.owner?.full_name || store.owner_email || "No owner profile";
}

function ownerEmailSuffix(store) {
  return store.owner?.full_name && store.owner_email ? ` · ${store.owner_email}` : "";
}

export default function Stores() {
  const [filters, setFilters] = useState({ q: "", verified: "any", active: "any" });
  const query = useStores({
    q: filters.q,
    verified: boolValue(filters.verified),
    active: boolValue(filters.active),
    limit: 50,
  });
  const updateStore = useUpdateStore();

  const patch = (id, next) => updateStore.mutate({ id, patch: next });

  return (
    <div>
      <h1 className="text-heading text-ink">Stores</h1>
      <p className="mt-1 text-body text-ink-muted">
        Search stores, inspect ownership, and control verification or active state.
      </p>

      <div className="mt-5 grid gap-3 rounded-panel border border-line bg-surface p-4 md:grid-cols-[1fr_12rem_12rem]">
        <input
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          placeholder="Search by store name"
          className="rounded-control border border-line bg-surface px-3 py-2.5 text-[0.9375rem] focus:border-primary focus:outline-none"
        />
        <select
          value={filters.verified}
          onChange={(event) => setFilters({ ...filters, verified: event.target.value })}
          className="rounded-control border border-line bg-surface px-3 py-2.5 text-[0.9375rem] focus:border-primary focus:outline-none"
        >
          <option value="any">Any verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
        <select
          value={filters.active}
          onChange={(event) => setFilters({ ...filters, active: event.target.value })}
          className="rounded-control border border-line bg-surface px-3 py-2.5 text-[0.9375rem] focus:border-primary focus:outline-none"
        >
          <option value="any">Any active state</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {query.isPending ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : query.isError ? (
        <Alert tone="error" title="Could not load stores" className="mt-6">
          {query.error?.message ?? "Please try again."}
        </Alert>
      ) : (
        <div className="mt-6 divide-y divide-line-soft rounded-panel border border-line bg-surface">
          {query.data.length === 0 ? (
            <p className="p-6 text-body text-ink-muted">No stores match those filters.</p>
          ) : (
            query.data.map((store) => (
              <article key={store.id} className="grid gap-4 p-4 xl:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-card text-ink">{store.name}</h2>
                    <StatusPill tone={store.is_verified ? "success" : "warning"}>
                      {store.is_verified ? "Verified" : "Unverified"}
                    </StatusPill>
                    <StatusPill tone={store.is_active ? "success" : "neutral"}>
                      {store.is_active ? "Active" : "Inactive"}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-meta text-ink-muted">
                    {store.locality}, {store.city}, {store.state} {store.postal_code}
                  </p>
                  <p className="mt-1 text-meta text-ink-muted">
                    Owner: {ownerLabel(store)}
                    {ownerEmailSuffix(store)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button as={Link} to={`/stores/${store.id}`} variant="secondary" size="sm">
                    Inspect
                  </Button>
                  <Button
                    variant={store.is_verified ? "danger" : "secondary"}
                    size="sm"
                    onClick={() => {
                      if (store.is_verified && !window.confirm("Unverify this live store? It will disappear from customer results.")) return;
                      patch(store.id, { is_verified: !store.is_verified });
                    }}
                    isLoading={updateStore.isPending}
                  >
                    {store.is_verified ? "Unverify" : "Verify"}
                  </Button>
                  <Button
                    variant={store.is_active ? "danger" : "secondary"}
                    size="sm"
                    onClick={() => {
                      if (store.is_active && !window.confirm("Deactivate this store? It will disappear from customer results.")) return;
                      patch(store.id, { is_active: !store.is_active });
                    }}
                    isLoading={updateStore.isPending}
                  >
                    {store.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
