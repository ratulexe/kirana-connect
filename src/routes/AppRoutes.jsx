import { Routes, Route } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout.jsx";
import Home from "../pages/customer/Home.jsx";
import NotFound from "../pages/customer/NotFound.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
