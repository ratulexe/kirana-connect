import { useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import Button from "./Button.jsx";
import {
  useProductMedia,
  useCreateProductMedia,
  useUpdateProductMedia,
  useDeleteProductMedia,
} from "../features/admin/useAdmin.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const FIXED_MEDIA_TYPES = new Set(["front", "back"]);

function validateImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) return "Please select a JPG, PNG, or WebP image.";
  if (file.size > MAX_FILE_SIZE) return "Image must be smaller than 5 MB.";
  return "";
}

function fallbackName(media, index) {
  if (media.alt_text) return media.alt_text;
  if (media.media_type === "nutrition") return "Nutrition facts";
  return `Image ${index + 1}`;
}

function FixedMediaSlot({ label, type, productId, media, isPrimary = false }) {
  const upload = useCreateProductMedia();
  const remove = useDeleteProductMedia();
  const fileInput = useRef(null);
  const [error, setError] = useState("");
  const existingMedia = media.find((item) => item.media_type === type);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    try {
      await upload.mutateAsync({
        productId,
        file,
        metadata: {
          mediaType: type,
          altText: label,
          isPrimary,
        },
      });
    } catch (err) {
      setError(err?.message ?? `Could not upload ${label.toLowerCase()}.`);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line-soft bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-card text-ink">{label}</h4>
          <p className="text-meta text-ink-muted">
            {existingMedia ? "Click the image to replace it." : "Upload this side of the pack."}
          </p>
        </div>
        {existingMedia ? (
          <button
            type="button"
            className="rounded-control p-2 text-ink-muted hover:bg-danger-soft hover:text-danger"
            onClick={() => remove.mutate({ id: existingMedia.id, productId })}
            disabled={remove.isPending}
            title={`Remove ${label}`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={upload.isPending}
        className="relative flex h-40 items-center justify-center overflow-hidden rounded-control border border-dashed border-line-soft bg-canvas text-ink-muted transition-colors hover:border-primary/45 hover:text-primary disabled:pointer-events-none disabled:opacity-45"
      >
        {existingMedia ? (
          <img src={existingMedia.image_url} alt="" className="size-full object-contain p-2" />
        ) : (
          <span className="grid justify-items-center gap-2 text-meta font-semibold">
            <Upload className="size-6" aria-hidden="true" />
            Upload {label}
          </span>
        )}
      </button>

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {upload.isPending ? <p className="text-meta text-primary">Uploading...</p> : null}
      {error ? <p className="text-meta font-medium text-danger">{error}</p> : null}
    </div>
  );
}

function AdditionalImageCard({ media, index, productId }) {
  const remove = useDeleteProductMedia();
  const update = useUpdateProductMedia();
  const [name, setName] = useState(fallbackName(media, index));
  const [error, setError] = useState("");

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === (media.alt_text ?? "")) return;

    setError("");
    try {
      await update.mutateAsync({ id: media.id, body: { alt_text: trimmed } });
    } catch (err) {
      setError(err?.message ?? "Could not save image name.");
    }
  };

  return (
    <div className="rounded-card border border-line-soft bg-surface p-3">
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-control bg-canvas">
        <img src={media.image_url} alt="" className="size-full object-contain p-2" />
        <button
          type="button"
          className="absolute right-2 top-2 rounded-control bg-surface/95 p-1.5 text-ink-muted shadow-sm hover:bg-danger-soft hover:text-danger"
          onClick={() => remove.mutate({ id: media.id, productId })}
          disabled={remove.isPending}
          title="Remove image"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-meta font-semibold text-ink-soft">Image name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={saveName}
          className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-meta text-ink focus:border-primary focus:outline-none"
          placeholder="Image name"
        />
      </label>
      {update.isPending ? <p className="mt-1 text-meta text-primary">Saving name...</p> : null}
      {error ? <p className="mt-1 text-meta font-medium text-danger">{error}</p> : null}
    </div>
  );
}

function AddImageCard({ productId, nextSortOrder }) {
  const upload = useCreateProductMedia();
  const fileInput = useRef(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const openPicker = () => {
    if (!name.trim()) {
      setError("Enter an image name first.");
      return;
    }
    setError("");
    fileInput.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    try {
      await upload.mutateAsync({
        productId,
        file,
        metadata: {
          mediaType: "promotional",
          altText: name.trim(),
          sortOrder: nextSortOrder,
        },
      });
      setName("");
    } catch (err) {
      setError(err?.message ?? "Could not upload image.");
    }
  };

  return (
    <div className="rounded-card border border-dashed border-line bg-canvas p-4">
      <label className="block">
        <span className="text-meta font-semibold text-ink-soft">Image name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2.5 text-meta text-ink focus:border-primary focus:outline-none"
          placeholder="Nutrition facts, side view, offer label..."
        />
      </label>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        className="mt-3"
        onClick={openPicker}
        isLoading={upload.isPending}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add image
      </Button>

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {error ? <p className="mt-2 text-meta font-medium text-danger">{error}</p> : null}
    </div>
  );
}

export default function ProductMediaSection({ productId }) {
  const { data: media = [], isPending } = useProductMedia(productId);
  const sortedMedia = useMemo(
    () => [...media].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [media],
  );
  const additionalMedia = sortedMedia.filter((item) => !FIXED_MEDIA_TYPES.has(item.media_type));
  const nextSortOrder = additionalMedia.length + 2;

  if (isPending) {
    return <div className="p-4 text-sm text-ink-muted">Loading media...</div>;
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h3 className="text-section font-semibold text-ink">Pack images</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Keep the main pack sides as front and back. Use the plus card for extra named images.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FixedMediaSlot
          label="Front image"
          type="front"
          productId={productId}
          media={sortedMedia}
          isPrimary
        />
        <FixedMediaSlot
          label="Back image"
          type="back"
          productId={productId}
          media={sortedMedia}
        />
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-card text-ink">More images</h4>
          <p className="text-meta text-ink-muted">
            Add nutrition facts, offer labels, side views, or any other image with a clear name.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {additionalMedia.map((item, index) => (
            <AdditionalImageCard
              key={item.id}
              media={item}
              index={index}
              productId={productId}
            />
          ))}
          <AddImageCard productId={productId} nextSortOrder={nextSortOrder} />
        </div>

        {additionalMedia.length === 0 ? (
          <div className="flex items-center gap-2 text-meta text-ink-muted">
            <ImageIcon className="size-4" aria-hidden="true" />
            No extra images yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
