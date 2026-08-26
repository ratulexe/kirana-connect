import { useEffect, useState } from "react";
import { AlertTriangle, Image as ImageIcon, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import Skeleton from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import {
  useCategories,
  useCreateCategory,
  useResolveProductImage,
  useUpdateCategory,
  useUploadProductImage,
} from "../features/admin/useAdmin.js";
import { categorySchema } from "../features/admin/schemas.js";
import { zodResolver } from "../lib/zodResolver.js";

const DEFAULTS = { name: "", description: "", image_url: "", is_active: true };
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

function CategoryImagePreview({ src, name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div className="grid size-24 place-items-center overflow-hidden rounded-card border border-line bg-surface">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="size-full object-contain p-2"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid justify-items-center gap-1 text-center text-meta text-ink-muted">
          <ImageIcon className="size-6" aria-hidden="true" />
          {name || "Image"}
        </div>
      )}
    </div>
  );
}

function toPayload(values) {
  return {
    ...values,
    description: values.description || null,
    image_url: values.image_url || null,
  };
}

function CategoryForm({ editing, onDone }) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const uploadImage = useUploadProductImage();
  const resolveImage = useResolveProductImage();
  const [uploadError, setUploadError] = useState("");
  const [resolveError, setResolveError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: editing
      ? {
          name: editing.name ?? "",
          description: editing.description ?? "",
          image_url: editing.image_url ?? "",
          is_active: Boolean(editing.is_active),
        }
      : DEFAULTS,
  });
  const mutation = editing ? update : create;
  const watchedName = watch("name");
  const imageUrl = watch("image_url");

  const handleImageFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setUploadError("Upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setUploadError("Category images must be 2 MB or smaller.");
      return;
    }

    setUploadError("");
    try {
      const uploaded = await uploadImage.mutateAsync(file);
      setValue("image_url", uploaded.public_url, { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      setUploadError(error?.message ?? "Could not upload image.");
    }
  };

  const resolveImageUrl = async () => {
    setResolveError("");
    try {
      const resolved = await resolveImage.mutateAsync(imageUrl);
      setValue("image_url", resolved.resolved_url, { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      setResolveError(error?.message ?? "Could not resolve that image URL.");
    }
  };

  const submit = async (values) => {
    const body = toPayload(values);
    if (editing) await update.mutateAsync({ id: editing.id, body });
    else await create.mutateAsync(body);
    onDone();
  };

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4 sm:grid-cols-2">
        {mutation.isError ? (
          <div className="sm:col-span-2">
            <Alert tone="error">{mutation.error?.message ?? "Could not save category."}</Alert>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Field label="Name" required error={errors.name?.message}>
            {(field) => <TextInput {...field} {...register("name")} invalid={Boolean(errors.name)} />}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <div className="grid gap-4 rounded-card border border-line-soft bg-surface-sunken p-4 sm:grid-cols-[6rem_1fr]">
            <CategoryImagePreview src={imageUrl} name={watchedName} />

            <div className="min-w-0">
              <p className="text-card text-ink">Category image</p>
              <p className="mt-1 text-meta text-ink-muted">
                Upload an image, or keep a direct image URL as a fallback.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-control bg-primary px-3.5 text-meta font-semibold text-primary-fg transition-colors hover:bg-primary-hover">
                  <Upload className="size-3.5" aria-hidden="true" />
                  {uploadImage.isPending ? "Uploading..." : "Upload image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFile}
                    disabled={uploadImage.isPending}
                    className="sr-only"
                  />
                </label>
                {imageUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setValue("image_url", "", { shouldDirty: true, shouldValidate: true })}
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

              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field label="Image URL fallback" error={errors.image_url?.message}>
                  {(field) => (
                    <TextInput
                      {...field}
                      {...register("image_url")}
                      invalid={Boolean(errors.image_url)}
                      placeholder="https://..."
                    />
                  )}
                </Field>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!imageUrl || resolveImage.isPending}
                  onClick={resolveImageUrl}
                >
                  Resolve preview
                </Button>
              </div>

              {resolveError ? <p role="alert" className="mt-2 text-meta font-medium text-danger">{resolveError}</p> : null}
            </div>
          </div>
        </div>

        <div className="sm:col-span-2">
          <Field label="Description" error={errors.description?.message}>
            {(field) => <TextInput {...field} {...register("description")} invalid={Boolean(errors.description)} />}
          </Field>
        </div>
        <label className="inline-flex items-center gap-2 text-meta text-ink-soft">
          <input type="checkbox" {...register("is_active")} className="size-4 accent-[var(--color-primary)]" />
          Active
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            {editing ? "Save category" : "Create category"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function Categories() {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const categories = useCategories();
  const update = useUpdateCategory();

  useEffect(() => {
    // The form renders inline at the top of the page, above the list -- if
    // an admin was scrolled down when they clicked Edit, it opens off
    // screen and looks like the button did nothing.
    if (creating || editing) window.scrollTo({ top: 0, behavior: "auto" });
  }, [creating, editing]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading text-ink">Categories</h1>
          <p className="mt-1 text-body text-ink-muted">Create, edit, activate, or deactivate catalogue categories.</p>
        </div>
        {!creating ? <Button onClick={() => setCreating(true)}>Create category</Button> : null}
      </div>

      {(creating || editing) ? (
        <div className="mt-5">
          <CategoryForm
            editing={editing}
            onDone={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </div>
      ) : null}

      {categories.isPending ? (
        <div className="mt-6 space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : categories.isError ? (
        <Alert tone="error" title="Could not load categories" className="mt-6">
          {categories.error?.message ?? "Please try again."}
        </Alert>
      ) : (
        <div className="mt-6 divide-y divide-line-soft rounded-panel border border-line bg-surface">
          {categories.data.map((category) => (
            <article key={category.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-card border border-line-soft bg-surface-sunken">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt=""
                      className="size-full object-contain p-1.5"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <ImageIcon
                    className="size-5 text-ink-muted"
                    aria-hidden="true"
                    style={{ display: category.image_url ? 'none' : 'block' }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-card text-ink">{category.name}</h2>
                    <StatusPill tone={category.is_active ? "success" : "neutral"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-meta text-ink-muted">{category.description || "No description"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(category)}>Edit</Button>
                <Button
                  variant={category.is_active ? "danger" : "secondary"}
                  size="sm"
                  onClick={() => update.mutate({ id: category.id, body: { is_active: !category.is_active } })}
                  isLoading={update.isPending}
                >
                  {category.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
