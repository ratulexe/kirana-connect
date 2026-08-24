import { useState, useRef } from "react";
import { Trash2, Upload } from "lucide-react";
import Button from "./Button.jsx";
import {
  useProductMedia,
  useCreateProductMedia,
  useUpdateProductMedia,
  useDeleteProductMedia,
} from "../features/admin/useAdmin.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (to match backend limit)

function MediaUploadBox({ label, type, productId, media, isPrimary, onUploadSuccess }) {
  const upload = useCreateProductMedia();
  const remove = useDeleteProductMedia();
  const update = useUpdateProductMedia();
  const fileInput = useRef(null);
  const [error, setError] = useState(null);

  const existingMedia = media?.find((m) => m.media_type === type);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 5 MB.");
      return;
    }
    setError(null);

    try {
      await upload.mutateAsync({
        productId,
        file,
        metadata: {
          mediaType: type,
          isPrimary: isPrimary || false,
        },
      });
      onUploadSuccess?.();
      if (fileInput.current) fileInput.current.value = "";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-card border border-line-soft bg-surface p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-meta font-semibold text-ink">{label}</h4>
        {existingMedia && (
          <button
            type="button"
            className="rounded p-1 text-ink-muted hover:bg-canvas hover:text-error"
            onClick={() => remove.mutate({ id: existingMedia.id, productId })}
            disabled={remove.isPending}
            title="Remove image"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div className="relative mt-2 flex h-32 items-center justify-center overflow-hidden rounded-md border border-dashed border-line-soft bg-canvas">
        {existingMedia ? (
          <img src={existingMedia.image_url} alt="" className="size-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-muted">
            <Upload className="size-6" />
            <span className="text-xs">Upload {label}</span>
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg, image/png, image/webp"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleFileChange}
          disabled={upload.isPending}
        />
      </div>
      
      {upload.isPending && <p className="text-xs text-primary">Uploading...</p>}
      {error && <p className="text-xs text-error">{error}</p>}

      {existingMedia && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5 text-ink-soft cursor-pointer hover:text-ink">
            <input
              type="checkbox"
              checked={existingMedia.is_primary}
              onChange={(e) => update.mutate({ id: existingMedia.id, body: { is_primary: e.target.checked } })}
              disabled={update.isPending}
              className="accent-primary"
            />
            Make Primary
          </label>
        </div>
      )}
    </div>
  );
}

function PromotionalGallery({ productId, media }) {
  const promoMedia = media?.filter((m) => m.media_type === "promotional") || [];
  const upload = useCreateProductMedia();
  const remove = useDeleteProductMedia();
  const fileInput = useRef(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_FILE_SIZE) {
        setError("Some files were skipped (invalid type or > 5MB).");
        continue;
      }
      try {
        await upload.mutateAsync({
          productId,
          file,
          metadata: { mediaType: "promotional" },
        });
      } catch {
        setError(`Failed to upload ${file.name}`);
      }
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <div className="mt-6 rounded-card border border-line-soft bg-surface p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-meta font-semibold text-ink">Promotional Gallery</h4>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => fileInput.current?.click()}
          isLoading={upload.isPending}
        >
          <Upload className="mr-1.5 size-4" /> Add Image
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg, image/png, image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}

      {promoMedia.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-4">
          {promoMedia.map((m) => (
            <div key={m.id} className="relative h-24 w-24 overflow-hidden rounded-md border border-line-soft">
              <img src={m.image_url} alt="" className="size-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-black/50 p-1 text-white hover:bg-error"
                onClick={() => remove.mutate({ id: m.id, productId })}
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">No promotional images added yet.</p>
      )}
    </div>
  );
}

export default function ProductMediaSection({ productId }) {
  const { data: media, isPending } = useProductMedia(productId);

  if (isPending) {
    return <div className="p-4 text-sm text-ink-muted">Loading media...</div>;
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h3 className="text-section font-semibold text-ink">Product Media (Advanced)</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Add specific angles and information panels to build a rich gallery for customers. 
          The legacy single image field acts as a fallback.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MediaUploadBox 
          label="Front View" 
          type="front" 
          productId={productId} 
          media={media} 
          isPrimary={true}
        />
        <MediaUploadBox 
          label="Back View" 
          type="back" 
          productId={productId} 
          media={media} 
        />
        <MediaUploadBox 
          label="Nutrition Facts" 
          type="nutrition" 
          productId={productId} 
          media={media} 
        />
      </div>

      <PromotionalGallery productId={productId} media={media} />
    </div>
  );
}
