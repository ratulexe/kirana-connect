import { useEffect, useState } from "react";
import { AlertTriangle, Image as ImageIcon, Upload } from "lucide-react";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Skeleton from "../components/Skeleton.jsx";
import {
  useHomepageMoments,
  useUpdateHomepageMoment,
  useUploadProductImage,
} from "../features/admin/useAdmin.js";

// The six cards themselves (title, caption, search query, icon, gradient) are
// fixed in the Consumer app's src/features/home/DiscoveryMoments.jsx -- this
// page only ever manages an optional background image per card, matched by
// this same slug. Duplicated rather than shared, same as every other piece
// of per-app copy in this repo (the two apps are separate Vite projects).
const MOMENTS = [
  { slug: "breakfast-rush", title: "Breakfast rush", caption: "Milk, tea, bread & more" },
  { slug: "chai-break", title: "Chai break", caption: "The shelf staples you reach for" },
  { slug: "celebration", title: "A little celebration", caption: "Snacks, drinks, good mood" },
  { slug: "late-night", title: "Late-night needs", caption: "Find what is nearby now" },
  { slug: "sunday-stocking", title: "Sunday Stocking", caption: "Weekly essentials" },
  { slug: "festival-ready", title: "Festival Ready", caption: "Sweets and pooja items" },
];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

function MomentImagePreview({ src, title }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div className="grid aspect-video place-items-center overflow-hidden rounded-card border border-line bg-surface">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid justify-items-center gap-1 text-center text-meta text-ink-muted">
          <ImageIcon className="size-6" aria-hidden="true" />
          {title}
        </div>
      )}
    </div>
  );
}

function MomentCard({ slug, title, caption, imageUrl }) {
  const [uploadError, setUploadError] = useState("");
  const uploadImage = useUploadProductImage();
  const updateMoment = useUpdateHomepageMoment();

  const save = (nextUrl) => {
    updateMoment.mutate({ slug, body: { image_url: nextUrl || null } });
  };

  const handleImageFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setUploadError("Upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setUploadError("Images must be 2 MB or smaller.");
      return;
    }

    setUploadError("");
    try {
      const uploaded = await uploadImage.mutateAsync(file);
      save(uploaded.public_url);
    } catch (error) {
      setUploadError(error?.message ?? "Could not upload image.");
    }
  };

  return (
    <Card className="p-4">
      <MomentImagePreview src={imageUrl} title={title} />
      <p className="mt-3 text-card text-ink">{title}</p>
      <p className="text-meta text-ink-muted">{caption}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-control bg-primary px-3.5 text-meta font-semibold text-primary-fg transition-colors hover:bg-primary-hover">
          <Upload className="size-3.5" aria-hidden="true" />
          {uploadImage.isPending || updateMoment.isPending ? "Saving..." : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageFile}
            disabled={uploadImage.isPending || updateMoment.isPending}
            className="sr-only"
          />
        </label>
        {imageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => save(null)}
            disabled={updateMoment.isPending}
          >
            Remove image
          </Button>
        ) : null}
      </div>

      {uploadError ? (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-meta font-medium text-danger">
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          {uploadError}
        </p>
      ) : null}
      {updateMoment.isError ? (
        <p role="alert" className="mt-2 text-meta font-medium text-danger">
          {updateMoment.error?.message ?? "Could not save this image."}
        </p>
      ) : null}
    </Card>
  );
}

export default function HomepageMoments() {
  const moments = useHomepageMoments();
  const imageBySlug = new Map((moments.data ?? []).map((row) => [row.slug, row.image_url]));

  return (
    <div>
      <h1 className="text-heading text-ink">Homepage Moments</h1>
      <p className="mt-1 text-body text-ink-muted">
        Set a background image for each "Browse by mood" card on the Consumer homepage. Title,
        caption, and search query stay fixed -- only the image is editable here. A card with no
        image keeps its plain colour gradient.
      </p>

      {moments.isError ? (
        <Alert tone="error" title="Could not load images" className="mt-6">
          {moments.error?.message ?? "Please try again."}
        </Alert>
      ) : null}

      {moments.isPending ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOMENTS.map((moment) => (
            <MomentCard key={moment.slug} {...moment} imageUrl={imageBySlug.get(moment.slug)} />
          ))}
        </div>
      )}
    </div>
  );
}
