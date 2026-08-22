import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth.js";
import PageLoader from "../components/PageLoader.jsx";

/**
 * Gate for onboarding and status.
 *
 * Waits for the session check to finish before deciding, otherwise a signed-in
 * owner refreshing the page would be bounced to the login screen for a frame.
 * The attempted path is remembered so sign-in returns them where they were
 * going.
 */
export default function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader label="Checking your session" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
