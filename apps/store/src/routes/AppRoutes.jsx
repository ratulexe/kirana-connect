import { Routes, Route } from "react-router-dom";
import PortalLayout from "../layouts/PortalLayout.jsx";
import RequireAuth from "../auth/RequireAuth.jsx";
import Landing from "../pages/Landing.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Onboarding from "../pages/Onboarding.jsx";
import Status from "../pages/Status.jsx";
import Inventory from "../pages/Inventory.jsx";
import NotFound from "../pages/NotFound.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Onboarding and status require a verified Supabase session. */}
        <Route element={<RequireAuth />}>
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="status" element={<Status />} />
          <Route path="inventory" element={<Inventory />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
