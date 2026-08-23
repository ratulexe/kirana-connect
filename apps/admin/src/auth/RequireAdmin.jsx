import { Navigate, Outlet, useLocation } from "react-router-dom";
import PageLoader from "../components/PageLoader.jsx";
import Alert from "../components/Alert.jsx";
import { useAuth } from "./useAuth.js";
import { useAdminMe } from "../features/admin/useAdmin.js";

export default function RequireAdmin() {
  const auth = useAuth();
  const location = useLocation();
  const me = useAdminMe({ enabled: auth.isAuthenticated });

  if (auth.isLoading) return <PageLoader label="Checking session" />;
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (me.isPending) return <PageLoader label="Checking admin access" />;

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
