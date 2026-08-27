import { Navigate, Route, Routes } from "react-router-dom";
import RequireAdmin from "../auth/RequireAdmin.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import Login from "../pages/Login.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import PendingStores from "../pages/PendingStores.jsx";
import Stores from "../pages/Stores.jsx";
import StoreDetail from "../pages/StoreDetail.jsx";
import Sellers from "../pages/Sellers.jsx";
import Products from "../pages/Products.jsx";
import ProductForm from "../pages/ProductForm.jsx";
import Categories from "../pages/Categories.jsx";
import HomepageMoments from "../pages/HomepageMoments.jsx";
import BusinessCategories from "../pages/BusinessCategories.jsx";
import Brands from "../pages/Brands.jsx";
import NotFound from "../pages/NotFound.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="stores/pending" element={<PendingStores />} />
          <Route path="stores" element={<Stores />} />
          <Route path="stores/:storeId" element={<StoreDetail />} />
          <Route path="sellers" element={<Sellers />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm mode="create" />} />
          <Route path="products/:productId/edit" element={<ProductForm mode="edit" />} />
          <Route path="categories" element={<Categories />} />
          <Route path="homepage-moments" element={<HomepageMoments />} />
          <Route path="business-categories" element={<BusinessCategories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
