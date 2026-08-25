import { useEffect, useState } from "react";
import { AlertTriangle, Image as ImageIcon, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import Skeleton from "../components/Skeleton.jsx";
import {
  useBrands,
  useCreateBrand,
  useResolveProductImage,
  useUpdateBrand,
  useDeleteBrand,
  useUploadProductImage,
} from "../features/admin/useAdmin.js";
import { brandSchema } from "../features/admin/schemas.js";
import { zodResolver } from "../lib/zodResolver.js";
import DeleteBrandDialog from "../components/DeleteBrandDialog.jsx";
import { Trash2 } from "lucide-react";

const DEFAULTS = { name: "", logo_url: "" };
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

function BrandLogoPreview({ src, name }) {
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
          {name || "Logo"}
        </div>
      )}
    </div>
  );
}

function BrandForm({ editing, onDone }) {
  const create = useCreateBrand();
  const update = useUpdateBrand();
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
    resolver: zodResolver(brandSchema),
    defaultValues: editing ? { name: editing.name ?? "", logo_url: editing.logo_url ?? "" } : DEFAULTS,
  });
  const mutation = editing ? update : create;
  const watchedName = watch("name");
  const logoUrl = watch("logo_url");

  const handleLogoFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setUploadError("Upload a JPG, PNG, or WebP logo.");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setUploadError("Brand logos must be 2 MB or smaller.");
      return;
    }

    setUploadError("");
    try {
      const uploaded = await uploadImage.mutateAsync(file);
      setValue("logo_url", uploaded.public_url, { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      setUploadError(error?.message ?? "Could not upload logo.");
    }
  };

  const resolveLogoUrl = async () => {
    setResolveError("");
    try {
      const resolved = await resolveImage.mutateAsync(logoUrl);
      setValue("logo_url", resolved.resolved_url, { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      setResolveError(error?.message ?? "Could not resolve that logo URL.");
    }
  };

  const submit = async (values) => {
    const body = { ...values, logo_url: values.logo_url || null };
    if (editing) await update.mutateAsync({ id: editing.id, body });
    else await create.mutateAsync(body);
    onDone();
  };

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4 sm:grid-cols-2">
        {mutation.isError ? (
          <div className="sm:col-span-2">
            <Alert tone="error">{mutation.error?.message ?? "Could not save brand."}</Alert>
          </div>
        ) : null}
        <Field label="Name" required error={errors.name?.message}>
          {(field) => <TextInput {...field} {...register("name")} invalid={Boolean(errors.name)} />}
        </Field>

        <div className="sm:col-span-2">
          <div className="grid gap-4 rounded-card border border-line-soft bg-surface-sunken p-4 sm:grid-cols-[6rem_1fr]">
            <BrandLogoPreview src={logoUrl} name={watchedName} />

            <div className="min-w-0">
              <p className="text-card text-ink">Brand logo</p>
              <p className="mt-1 text-meta text-ink-muted">
                Upload a logo, or keep a direct image URL as a fallback.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-control bg-primary px-3.5 text-meta font-semibold text-primary-fg transition-colors hover:bg-primary-hover">
                  <Upload className="size-3.5" aria-hidden="true" />
                  {uploadImage.isPending ? "Uploading..." : "Upload logo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoFile}
                    disabled={uploadImage.isPending}
                    className="sr-only"
                  />
                </label>
                {logoUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setValue("logo_url", "", { shouldDirty: true, shouldValidate: true })}
                  >
                    Remove logo
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
                <Field label="Logo URL fallback" error={errors.logo_url?.message}>
                  {(field) => (
                    <TextInput
                      {...field}
                      {...register("logo_url")}
                      invalid={Boolean(errors.logo_url)}
                      placeholder="https://..."
                    />
                  )}
                </Field>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!logoUrl || resolveImage.isPending}
                  onClick={resolveLogoUrl}
                >
                  Resolve preview
                </Button>
              </div>

              {resolveError ? <p role="alert" className="mt-2 text-meta font-medium text-danger">{resolveError}</p> : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            {editing ? "Save brand" : "Create brand"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function Brands() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const deleteMutation = useDeleteBrand();
  const brands = useBrands();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading text-ink">Brands</h1>
          <p className="mt-1 text-body text-ink-muted">Create and edit canonical brands.</p>
        </div>
        {!creating ? <Button onClick={() => setCreating(true)}>Create brand</Button> : null}
      </div>

      {(creating || editing) ? (
        <div className="mt-5">
          <BrandForm
            editing={editing}
            onDone={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </div>
      ) : null}

      {brands.isPending ? (
        <div className="mt-6 space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : brands.isError ? (
        <Alert tone="error" title="Could not load brands" className="mt-6">
          {brands.error?.message ?? "Please try again."}
        </Alert>
      ) : (
        <div className="mt-6 divide-y divide-line-soft overflow-hidden rounded-panel border border-line bg-surface">
          {brands.data.map((brand) => (
            <article
              key={brand.id}
              className="grid min-w-0 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-card border border-line-soft bg-surface-sunken">
                  {brand.logo_url ? (
                    <img 
                      src={brand.logo_url} 
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
                    style={{ display: brand.logo_url ? 'none' : 'block' }}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-card text-ink">{brand.name}</h2>
                  <p className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-meta text-ink-muted">
                    {brand.logo_url || "No logo URL"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(brand)}>Edit</Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-error hover:bg-error/10 hover:text-error"
                  title="Delete brand"
                  onClick={() => {
                    deleteMutation.reset();
                    setBrandToDelete(brand);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <DeleteBrandDialog
        brand={brandToDelete}
        isPending={deleteMutation.isPending}
        error={deleteMutation.error?.message}
        onClose={() => setBrandToDelete(null)}
        onConfirm={async (id) => {
          try {
            await deleteMutation.mutateAsync(id);
            setBrandToDelete(null);
          } catch {
            // Error handled in dialog
          }
        }}
      />
    </div>
  );
}
