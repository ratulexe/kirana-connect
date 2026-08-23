import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Button from "../../components/common/Button.jsx";

export default function NotFound() {
  return (
    <Container className="py-20">
      <EmptyState
        icon={Compass}
        title="This page does not exist"
        description="The link may be out of date, or the page has not been built yet."
        action={
          <Button as={Link} to="/">
            Back to home
          </Button>
        }
        className="mx-auto max-w-lg"
      />
    </Container>
  );
}
