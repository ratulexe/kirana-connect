import { Link } from "react-router-dom";
import { BookmarkCheck } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

/**
 * Reserving an item at a store (so it's held for pickup) is a planned
 * feature, not a built one -- this is an honest placeholder, the same
 * pattern OrdersPage.jsx uses for the same reason: say plainly what does
 * and doesn't exist yet rather than showing an empty list that implies
 * "you have none" when the truth is "this isn't wired up."
 */
export default function ReservedPage() {
  return (
    <Container className="py-12 sm:py-16">
      <EmptyState
        icon={BookmarkCheck}
        title="Reservations are coming soon"
        description="Soon you'll be able to reserve a product at a nearby store and pick it up in person. For now, browse the catalogue and compare stores directly."
        action={<Button as={Link} to="/search">Browse products</Button>}
      />
    </Container>
  );
}
