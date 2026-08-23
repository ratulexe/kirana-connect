import { Link, useSearchParams } from "react-router-dom";
import { CircleCheck, Clock, Store as StoreIcon } from "lucide-react";
import Container from "../components/Container.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import PageLoader from "../components/PageLoader.jsx";
import { useOnboardingStatus } from "../features/onboarding/useOnboarding.js";
import { useEntranceAnimation } from "../animations/useEntranceAnimation.js";

function storeStatus(store) {
  return store.is_verified ? "Approved" : "Pending";
}

export default function Status() {
  const [searchParams] = useSearchParams();
  const { data, isPending, isError, error } = useOnboardingStatus();
  const containerRef = useEntranceAnimation(data?.status ?? "loading");

  if (isPending) return <PageLoader label="Loading your store" />;

  if (isError) {
    return (
      <Container className="py-12">
        <Alert tone="error" title="Could not load your store">
          {error?.message ?? "Please try again in a moment."}
        </Alert>
      </Container>
    );
  }
  if (data.status === "no_application") {
    return (
      <Container className="py-12 sm:py-16">
        <Card className="mx-auto max-w-md p-6 text-center">
          <h1 className="text-section text-ink">No store registered yet</h1>
          <p className="mt-2 text-body text-ink-muted">
            Register your store so nearby customers can find what you stock.
          </p>
          <Button as={Link} to="/onboarding" className="mt-6">
            Register your store
          </Button>
        </Card>
      </Container>
    );
  }

  const isApproved = data.status === "approved";
  const selectedStoreId = searchParams.get("store_id");
  const selectedStore =
    data.stores.find((store) => store.id === selectedStoreId) ??
    data.stores[0] ??
    null;

  return (
    <Container className="py-8 sm:py-10">
      <div ref={containerRef} className="mx-auto max-w-5xl">
        <h1 data-animate className="text-heading text-ink">
          {isApproved ? "Store dashboard" : "Store submitted"}
        </h1>

        <p data-animate className="mt-2 max-w-2xl text-body text-ink-muted">
          {isApproved
            ? "Manage each store separately. New stores go through admin review before customers see them."
            : "Your store is awaiting verification. We will make it discoverable to customers once it is approved."}
        </p>

        <div data-animate className="mt-6 flex flex-wrap gap-2">
          <Button as={Link} to="/onboarding?new=1">
            <StoreIcon className="size-4" aria-hidden="true" />
            Register another store
          </Button>
        </div>

        {data.stores.length > 1 ? (
          <div data-animate className="mt-6 grid gap-3 lg:grid-cols-2">
            {data.stores.map((store) => (
              <Link
                key={store.id}
                to={`/status?store_id=${store.id}`}
                aria-current={selectedStore?.id === store.id ? "true" : undefined}
                className="group block rounded-card focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <Card
                  className={`p-4 transition-colors group-hover:border-primary/40 ${
                    selectedStore?.id === store.id ? "border-primary bg-primary-soft/40" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-card text-ink">{store.name}</h2>
                      <p className="mt-1 text-meta text-ink-muted">
                        {store.locality}, {store.city}, {store.state} {store.postal_code}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-meta font-semibold ${
                        store.is_verified ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                      }`}
                    >
                      {store.is_verified ? (
                        <CircleCheck className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Clock className="size-3.5" aria-hidden="true" />
                      )}
                      {storeStatus(store)}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : null}

        {!isApproved ? (
          <div data-animate className="mt-5 max-w-xl">
            <Alert tone="info">
              Nothing else is needed from you right now. You can sign in any time to check
              this page.
            </Alert>
          </div>
        ) : null}

      </div>
    </Container>
  );
}
