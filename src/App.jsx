import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.js";
import AppRoutes from "./routes/AppRoutes.jsx";
import OfflineOverlay from "./components/common/OfflineOverlay.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <OfflineOverlay />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
