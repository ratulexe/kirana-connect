import { Routes, Route } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout.jsx";
import Home from "../pages/customer/Home.jsx";
import SearchResults from "../pages/customer/SearchResults.jsx";
import ProductDetail from "../pages/customer/ProductDetail.jsx";
import Login from "../pages/customer/Login.jsx";
import Register from "../pages/customer/Register.jsx";
import ForgotPassword from "../pages/customer/ForgotPassword.jsx";
import ResetPassword from "../pages/customer/ResetPassword.jsx";
import Account from "../pages/customer/Account.jsx";
import NotFound from "../pages/customer/NotFound.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
