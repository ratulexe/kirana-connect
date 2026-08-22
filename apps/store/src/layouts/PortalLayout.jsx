import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import Container from "../components/Container.jsx";
import Button from "../components/Button.jsx";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../auth/useAuth.js";

export default function PortalLayout() {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

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
          <div className="flex h-14 items-center justify-between gap-3">
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
