import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Skeleton from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import {
  useApproveStore,
  useRejectStore,
  useStore,
  useUpdateStore,
} from "../features/admin/useAdmin.js";
import { formatDate } from "../utils/format.js";

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ownerLabel(store) {
  return store.owner?.full_name || store.owner_email || "No owner profile";
}

export default function StoreDetail() {
  const { storeId } = useParams();
  const store = useStore(storeId);
  const approve = useApproveStore();
  const reject = useRejectStore();
  const update = useUpdateStore();

  if (store.isPending) return <Skeleton className="h-96" />;
  if (store.isError) {
    return (
      <Alert tone="error" title="Could not load store">
        {store.error?.message ?? "Please try again."}
      </Alert>
    );
  }

  const data = store.data;

  return (
    <div className="max-w-5xl">
      <Button as={Link} to="/stores" variant="ghost" size="sm">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to stores
      </Button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-heading text-ink">{data.name}</h1>
            <StatusPill tone={data.is_verified ? "success" : "warning"}>
              {data.is_verified ? "Verified" : "Pending"}
            </StatusPill>
            <StatusPill tone={data.is_active ? "success" : "neutral"}>
              {data.is_active ? "Active" : "Inactive"}
            </StatusPill>
          </div>
          <p className="mt-1 text-body text-ink-muted">
            Submitted {formatDate(data.created_at)} · Updated {formatDate(data.updated_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!data.is_verified ? (
            <>
              <Button onClick={() => approve.mutate(data.id)} isLoading={approve.isPending}>
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm("Reject and delete this unverified application?")) reject.mutate(data.id);
                }}
                isLoading={reject.isPending}
              >
                Reject
              </Button>
            </>
          ) : null}
          <Button
            variant={data.is_active ? "danger" : "secondary"}
            onClick={() => update.mutate({ id: data.id, patch: { is_active: !data.is_active } })}
            isLoading={update.isPending}
          >
            {data.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {(approve.isError || reject.isError || update.isError) ? (
        <Alert tone="error" className="mt-4">
          {approve.error?.message || reject.error?.message || update.error?.message}
        </Alert>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-section text-ink">Store details</h2>
          <dl className="mt-4 space-y-3 text-body">
            <div>
              <dt className="text-meta font-semibold text-ink-muted">Address</dt>
              <dd className="text-ink">
                {data.address_line_1}
                {data.address_line_2 ? `, ${data.address_line_2}` : ""}, {data.locality}, {data.city}, {data.state} {data.postal_code}
              </dd>
            </div>
            <div>
              <dt className="text-meta font-semibold text-ink-muted">Coordinates</dt>
              <dd className="font-mono text-meta text-ink">
                {data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-meta font-semibold text-ink-muted">Phone</dt>
              <dd className="text-ink">{data.phone || "Not set"}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="text-section text-ink">Owner</h2>
          <dl className="mt-4 space-y-3 text-body">
            <div>
              <dt className="text-meta font-semibold text-ink-muted">Name</dt>
              <dd className="text-ink">{ownerLabel(data)}</dd>
            </div>
            <div>
              <dt className="text-meta font-semibold text-ink-muted">Email</dt>
              <dd className="text-ink">{data.owner_email ?? "Not available"}</dd>
            </div>
            <div>
              <dt className="text-meta font-semibold text-ink-muted">Role</dt>
              <dd className="text-ink">{data.owner?.role ?? "Unknown"}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="text-section text-ink">Opening hours</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {data.hours.map((hour) => (
            <div key={hour.day_of_week} className="rounded-control border border-line-soft px-3 py-2 text-meta">
              <p className="font-semibold text-ink">{DAY[hour.day_of_week]}</p>
              <p className="text-ink-muted">
                {hour.is_closed ? "Closed" : `${hour.opens_at} - ${hour.closes_at}`}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
