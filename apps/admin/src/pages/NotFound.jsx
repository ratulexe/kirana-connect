import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";

export default function NotFound() {
  return (
    <div className="max-w-lg">
      <h1 className="text-heading text-ink">Page not found</h1>
      <p className="mt-2 text-body text-ink-muted">That admin route does not exist.</p>
      <Button as={Link} to="/" className="mt-5">
        Back to dashboard
      </Button>
    </div>
  );
}
