import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout.jsx';

const Home = lazy(() => import('../pages/customer/Home.jsx'));
const SearchResults = lazy(() => import('../pages/customer/SearchResults.jsx'));
const ProductDetail = lazy(() => import('../pages/customer/ProductDetail.jsx'));
const Login = lazy(() => import('../pages/customer/Login.jsx'));
const Register = lazy(() => import('../pages/customer/Register.jsx'));
const ForgotPassword = lazy(() => import('../pages/customer/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('../pages/customer/ResetPassword.jsx'));
const Account = lazy(() => import('../pages/customer/Account.jsx'));
const NotFound = lazy(() => import('../pages/customer/NotFound.jsx'));
const DealsPage = lazy(() => import('../pages/customer/DealsPage.jsx'));
const BestOffersPage = lazy(() => import('../pages/customer/BestOffersPage.jsx'));
const WishlistPage = lazy(() => import('../pages/customer/WishlistPage.jsx'));
const OrdersPage = lazy(() => import('../pages/customer/OrdersPage.jsx'));
const NotificationsPage = lazy(() => import('../pages/customer/NotificationsPage.jsx'));
const StoresPage = lazy(() => import('../pages/customer/StoresPage.jsx'));
const TrendingPage = lazy(() => import('../pages/customer/TrendingPage.jsx'));
const PrivacyPage = lazy(() => import('../pages/customer/PrivacyPage.jsx'));
const TermsPage = lazy(() => import('../pages/customer/TermsPage.jsx'));

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
        <Route path="best-offers" element={<BestOffersPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="stores" element={<StoresPage />} />
        <Route path="trending" element={<TrendingPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
