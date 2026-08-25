import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Check, LocateFixed, LogIn, Megaphone } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Alert from "../../components/common/Alert.jsx";
import Modal from "../../components/common/Modal.jsx";
import { useAuth } from "../../auth/useAuth.js";
import { useLocationStore } from "../../store/locationStore.js";
import { createDemandRequest } from "../../services/demand.js";

/**
 * "I want this, but no nearby store has it" -- the whole demand-request
 * feature lives in this one component so ProductDetail only has to render it
 * where the empty state already is.
 *
 * Requesting needs two things the customer may not have yet: a session and a
 * location. Each gap gets its own small on-brand modal rather than a bigger
 * gate blocking the page, since cancelling either one should just leave the
 * customer back where they were.
 */
export default function RequestProduct({ productVariantId, productLabel, radiusKm }) {
  const { isAuthenticated } = useAuth();
  const { location, status: locationStatus, detect } = useLocationStore();
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const [modal, setModal] = useState(null); // null | "sign-in" | "location"
  const [requested, setRequested] = useState(false);
  const [feedback, setFeedback] = useState(null); // { tone, message }
  const retryAfterLocationRef = useRef(false);

  const mutation = useMutation({
    mutationFn: createDemandRequest,
    onSuccess: (data) => {
      setRequested(true);
      setFeedback({
        tone: "success",
        message: data.already_requested
          ? `Request already active. Nearby stores can already see that you're looking for ${productLabel}.`
          : `Request sent. Nearby stores can now see demand for ${productLabel}. This is not an order or reservation.`,
      });
    },
    onError: (error) => {
      setFeedback({
        tone: error.status === 409 ? "info" : "error",
        message:
          error.status === 409
            ? "A nearby store already has this -- check the offers above."
            : (error.message ?? "Could not send your request. Please try again."),
      });
    },
  });

  const submit = () => {
    mutation.mutate({
      productVariantId,
      latitude: location.lat,
      longitude: location.lng,
      radiusKm,
    });
  };

  // Once the customer sets a location from inside the location modal, finish
  // the request they originally asked for instead of making them press twice.
  useEffect(() => {
    if (!retryAfterLocationRef.current) return;
    if (locationStatus === "ready" && location) {
      retryAfterLocationRef.current = false;
      setModal(null);
      submit();
    } else if (locationStatus === "error") {
      retryAfterLocationRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationStatus, location]);

  const handleRequestClick = () => {
    setFeedback(null);

    if (!isAuthenticated) {
      setModal("sign-in");
      return;
    }
    if (!location) {
      setModal("location");
      return;
    }
    submit();
  };

  const goToSignIn = () => {
    setModal(null);
    navigate("/login", { state: { from: `${routerLocation.pathname}${routerLocation.search}` } });
  };

  const setLocationNow = () => {
    retryAfterLocationRef.current = true;
    detect();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        variant="secondary"
        onClick={handleRequestClick}
        disabled={requested || mutation.isPending}
      >
        {requested ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Megaphone className="size-4" aria-hidden="true" />
        )}
        {requested ? "Requested" : mutation.isPending ? "Sending..." : "Request this product"}
      </Button>

      {feedback ? (
        <Alert tone={feedback.tone} className="max-w-sm text-left">
          {feedback.message}
        </Alert>
      ) : null}

      <Modal
        open={modal === "sign-in"}
        onClose={() => setModal(null)}
        title="Sign in to request this product"
        icon={LogIn}
      >
        <p className="text-body text-ink-soft">
          We use your account to prevent duplicate requests and help nearby stores understand real
          local demand.
        </p>
        <p className="mt-2 text-meta text-ink-muted">
          Your request does not place an order or reserve the item.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={goToSignIn}>
            Sign in
          </Button>
        </div>
      </Modal>

      <Modal
        open={modal === "location"}
        onClose={() => {
          retryAfterLocationRef.current = false;
          setModal(null);
        }}
        title="Set your location"
        icon={LocateFixed}
      >
        <p className="text-body text-ink-soft">
          We need your location so nearby stores can see demand in their area.
        </p>
        {locationStatus === "error" ? (
          <Alert tone="warning" className="mt-3">
            Your location could not be found. Please try again.
          </Alert>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              retryAfterLocationRef.current = false;
              setModal(null);
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={setLocationNow} disabled={locationStatus === "locating"}>
            {locationStatus === "locating" ? "Locating..." : "Set location"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
