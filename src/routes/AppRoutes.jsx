import { Routes, Route } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout.jsx";
import Home from "../pages/customer/Home.jsx";
import SearchResults from "../pages/customer/SearchResults.jsx";
import ProductDetail from "../pages/customer/ProductDetail.jsx";
import NotFound from "../pages/customer/NotFound.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
