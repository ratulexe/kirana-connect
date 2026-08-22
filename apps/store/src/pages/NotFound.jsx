import { Link } from "react-router-dom";
import Container from "../components/Container.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";

export default function NotFound() {
  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-md p-6 text-center">
        <h1 className="text-section text-ink">This page does not exist</h1>
        <p className="mt-2 text-body text-ink-muted">
          The link may be out of date, or the page has not been built yet.
        </p>
        <Button as={Link} to="/" className="mt-6">
          Back to start
        </Button>
      </Card>
    </Container>
  );
}
