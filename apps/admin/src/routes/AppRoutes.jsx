import { Navigate, Route, Routes } from "react-router-dom";
import RequireAdmin from "../auth/RequireAdmin.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import Login from "../pages/Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import PendingStores from "../pages/PendingStores.jsx";
import Stores from "../pages/Stores.jsx";
import StoreDetail from "../pages/StoreDetail.jsx";
import Sellers from "../pages/Sellers.jsx";
import Products from "../pages/Products.jsx";
import ProductForm from "../pages/ProductForm.jsx";
import Categories from "../pages/Categories.jsx";
import Brands from "../pages/Brands.jsx";
import NotFound from "../pages/NotFound.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
          <Route path="brands" element={<Brands />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
