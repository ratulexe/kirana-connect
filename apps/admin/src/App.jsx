import AppRoutes from "./routes/AppRoutes.jsx";
import OfflineOverlay from "./components/OfflineOverlay.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      <OfflineOverlay />
    </>
  );
}
