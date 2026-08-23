import { Link, Outlet, useNavigate } from "react-router-dom";
import { CircleCheck, Clock, LogOut, MapPin, Store as StoreIcon } from "lucide-react";
import Container from "../components/Container.jsx";
import Button from "../components/Button.jsx";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../auth/useAuth.js";
import { useOnboardingStatus } from "../features/onboarding/useOnboarding.js";

export default function PortalLayout() {
  const { isAuthenticated, user, signOut } = useAuth();
  const { data: onboarding } = useOnboardingStatus({ enabled: isAuthenticated });
  const navigate = useNavigate();
  const store = onboarding?.stores?.[0] ?? null;
  const isApproved = onboarding?.status === "approved";

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-meta focus:font-semibold focus:text-primary-fg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line-soft bg-canvas/85 backdrop-blur-md">
        <Container>
          <div className="flex min-h-14 items-center justify-between gap-3 py-2">
            <Logo />

            {isAuthenticated ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="hidden max-w-[14rem] truncate text-meta text-ink-muted sm:inline">
                  {user?.email}
                </span>
                <Button variant="secondary" size="sm" onClick={handleSignOut}>
                  <LogOut className="size-4" aria-hidden="true" />
                  Sign out
                </Button>
              </div>
            ) : null}
          </div>

          {store ? (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line-soft py-2">
              <Link
                to="/status"
                className="group flex min-w-0 items-center gap-3 rounded-control py-1 pr-2 transition-colors hover:text-primary"
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill bg-surface-sunken text-primary">
                  <StoreIcon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-card text-ink group-hover:text-primary">
                    {store.name}
                  </span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-1 text-meta text-ink-muted">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {store.locality}, {store.city}, {store.state} {store.postal_code}
                    </span>
                  </span>
                </span>
              </Link>

              <span
                className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-meta font-semibold ${
                  isApproved ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                }`}
              >
                {isApproved ? (
                  <CircleCheck className="size-3.5" aria-hidden="true" />
                ) : (
                  <Clock className="size-3.5" aria-hidden="true" />
                )}
                {isApproved ? "Approved" : "Pending"}
              </span>
            </div>
          ) : null}
        </Container>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-line-soft bg-surface">
        <Container className="flex flex-col gap-1 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-meta text-ink-muted">
            Kirana Connect helps nearby customers find what you stock.
          </p>
          <p className="text-meta text-ink-muted">
            &copy; {new Date().getFullYear()} Kirana Connect
          </p>
        </Container>
      </footer>
    </div>
  );
}
