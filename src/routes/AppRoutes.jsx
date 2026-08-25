import { Routes, Route } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout.jsx';
import Home from '../pages/customer/Home.jsx';
import SearchResults from '../pages/customer/SearchResults.jsx';
import ProductDetail from '../pages/customer/ProductDetail.jsx';
import Login from '../pages/customer/Login.jsx';
import Register from '../pages/customer/Register.jsx';
import ForgotPassword from '../pages/customer/ForgotPassword.jsx';
import ResetPassword from '../pages/customer/ResetPassword.jsx';
import Account from '../pages/customer/Account.jsx';
import NotFound from '../pages/customer/NotFound.jsx';
import DealsPage from '../pages/customer/DealsPage.jsx';
import CartPage from '../pages/customer/CartPage.jsx';
import WishlistPage from '../pages/customer/WishlistPage.jsx';
import OrdersPage from '../pages/customer/OrdersPage.jsx';
import NotificationsPage from '../pages/customer/NotificationsPage.jsx';
import StoresPage from '../pages/customer/StoresPage.jsx';
import TrendingPage from '../pages/customer/TrendingPage.jsx';

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
        <Route path="deals" element={<DealsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="stores" element={<StoresPage />} />
        <Route path="trending" element={<TrendingPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
