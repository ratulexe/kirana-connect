import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.js";
import AppRoutes from "./routes/AppRoutes.jsx";
import OfflineOverlay from "./components/common/OfflineOverlay.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";
import AppLoader from "./components/common/AppLoader.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {loading ? (
          <AppLoader onDone={() => setLoading(false)} />
        ) : (
          <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
            <OfflineOverlay />
          </BrowserRouter>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
