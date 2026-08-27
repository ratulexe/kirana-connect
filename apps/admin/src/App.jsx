import { useState } from "react";
import AppRoutes from "./routes/AppRoutes.jsx";
import OfflineOverlay from "./components/OfflineOverlay.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import AppLoader from "./components/AppLoader.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);

  if (loading) return <AppLoader onDone={() => setLoading(false)} />;

  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      <OfflineOverlay />
    </>
  );
}
