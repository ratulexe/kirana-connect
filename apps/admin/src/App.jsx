import AppRoutes from "./routes/AppRoutes.jsx";
import OfflineOverlay from "./components/OfflineOverlay.jsx";

export default function App() {
  return (
    <>
      <AppRoutes />
      <OfflineOverlay />
    </>
  );
}
