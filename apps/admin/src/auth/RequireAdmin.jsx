import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import PageLoader from "../components/PageLoader.jsx";
import Alert from "../components/Alert.jsx";
import { useAuth } from "./useAuth.js";
import { useAdminMe } from "../features/admin/useAdmin.js";

export default function RequireAdmin() {
  const auth = useAuth();
  const location = useLocation();
  const me = useAdminMe({ enabled: auth.isAuthenticated });

  // A 401 here means the server rejected the token itself (expired or
  // otherwise invalid) -- a stale local session the client still thinks is
  // valid, not "signed in but not an admin" (that's 403, handled below).
  // Clearing it and bouncing to /login matches what would have happened had
  // auth.isAuthenticated been false to begin with, instead of leaving the
  // admin stuck on a dead-end error screen with no way back to sign-in.
  const sessionInvalid = me.isError && me.error?.status === 401;

  useEffect(() => {
    if (sessionInvalid) auth.signOut();
  }, [sessionInvalid, auth]);

  if (auth.isLoading) return <PageLoader label="Checking session" />;
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (me.isPending) return <PageLoader label="Checking admin access" />;
  if (sessionInvalid) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (me.isError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Alert tone={me.error?.status === 403 ? "warning" : "error"} title="Admin access unavailable">
          {me.error?.message ?? "Please sign in with an admin account."}
        </Alert>
      </div>
    );
  }

  return <Outlet />;
}
