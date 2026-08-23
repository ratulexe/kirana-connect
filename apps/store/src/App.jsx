import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.js";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import OfflineOverlay from "./components/OfflineOverlay.jsx";

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
