import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

/** Kirana Connect is discovery-first and does not currently create orders. */
export default function OrdersPage() {
  return (
    <Container className="py-12 sm:py-16">
      <EmptyState icon={PackageSearch} title="Orders are not placed in Kirana Connect" description="Use the catalogue to compare nearby stores, then visit the shop and purchase at its counter." action={<Button as={Link} to="/search">Browse products</Button>} />
    </Container>
  );
}
