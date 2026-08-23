import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Container from "../components/Container.jsx";
import Button from "../components/Button.jsx";
import InventoryManager from "../features/inventory/InventoryManager.jsx";

export default function Inventory() {
  return (
    <Container className="py-10 sm:py-12">
      <div className="mb-6">
        <Button as={Link} to="/status" variant="secondary">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Button>
      </div>
      <InventoryManager compact />
    </Container>
  );
}
