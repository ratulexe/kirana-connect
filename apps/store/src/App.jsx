import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.js";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import OfflineOverlay from "./components/OfflineOverlay.jsx";
import AppLoader from "./components/AppLoader.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {loading ? (
          <AppLoader onDone={() => setLoading(false)} />
        ) : (
          <BrowserRouter>
            <AppRoutes />
            <OfflineOverlay />
          </BrowserRouter>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
