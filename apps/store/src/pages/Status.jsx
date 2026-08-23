import { Link } from "react-router-dom";
import { CircleCheck, Clock, MapPin, PackageSearch, Store as StoreIcon } from "lucide-react";
import Container from "../components/Container.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import PageLoader from "../components/PageLoader.jsx";
import { useOnboardingStatus } from "../features/onboarding/useOnboarding.js";
import { useAuth } from "../auth/useAuth.js";
import { useEntranceAnimation } from "../animations/useEntranceAnimation.js";

function StoreSummary({ store }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <StoreIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-card text-ink">{store.name}</p>
          {store.description ? (
            <p className="mt-0.5 text-meta text-ink-muted">{store.description}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-body text-ink-soft">
          {store.locality}, {store.city}, {store.state} {store.postal_code}
        </p>
      </div>
    </div>
  );
}

export default function Status() {
  const { data, isPending, isError, error } = useOnboardingStatus();
  const { signOut } = useAuth();
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

  const store = data.stores[0] ?? null;

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

  return (
    <Container className="py-10 sm:py-14">
      <div ref={containerRef} className="mx-auto max-w-xl">
        <span
          data-animate
          className={`inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-meta font-semibold ${
            isApproved ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
          }`}
        >
          {isApproved ? (
            <CircleCheck className="size-4" aria-hidden="true" />
          ) : (
            <Clock className="size-4" aria-hidden="true" />
          )}
          {isApproved ? "Approved" : "Pending verification"}
        </span>

        <h1 data-animate className="mt-4 text-heading text-ink">
          {isApproved ? "Your store is approved" : "Store submitted"}
        </h1>

        <p data-animate className="mt-2 text-body text-ink-muted">
          {isApproved
            ? "Your store is verified and can now appear in customer search results."
            : "Your store is awaiting verification. We will make it discoverable to customers once it is approved."}
        </p>

        {store ? (
          <Card data-animate className="mt-6 p-5 sm:p-6">
            <StoreSummary store={store} />
          </Card>
        ) : null}

        <div data-animate className="mt-5">
          {isApproved ? (
            <Alert tone="success" title="You can list your products">
              Add the items you stock and set your own price for each, so nearby
              customers searching for them find your shop.
            </Alert>
          ) : (
            <Alert tone="info">
              Nothing else is needed from you right now. You can sign in any time to check
              this page.
            </Alert>
          )}
        </div>

        <div data-animate className="mt-6 flex flex-wrap gap-3">
          {isApproved ? (
            <Button as={Link} to="/inventory">
              <PackageSearch className="size-4" aria-hidden="true" />
              Manage products
            </Button>
          ) : null}
          <Button variant="secondary" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </Container>
  );
}
