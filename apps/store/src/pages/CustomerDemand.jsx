import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Container from "../components/Container.jsx";
import Button from "../components/Button.jsx";
import DemandManager from "../features/demand/DemandManager.jsx";

export default function CustomerDemand() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("store_id") ?? undefined;

  return (
    <Container className="py-10 sm:py-12">
      <div className="mb-6">
        <Button as={Link} to="/status" variant="secondary">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Button>
      </div>
      <DemandManager storeId={storeId} />
    </Container>
  );
}
