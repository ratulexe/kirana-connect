import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.js";
import AppRoutes from "./routes/AppRoutes.jsx";
import OfflineOverlay from "./components/common/OfflineOverlay.jsx";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <OfflineOverlay />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
