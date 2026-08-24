import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Image as ImageIcon, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Field, { SelectInput, TextInput } from "../components/Field.jsx";
import Skeleton from "../components/Skeleton.jsx";
import ProductMediaSection from "../components/ProductMediaSection.jsx";
import {
  useBrands,
  useCategories,
  useCreateProduct,
  useProduct,
  useProducts,
  useUpdateProduct,
  useUploadProductImage,
} from "../features/admin/useAdmin.js";
import { productSchema } from "../features/admin/schemas.js";
import { zodResolver } from "../lib/zodResolver.js";

const DEFAULTS = {
  name: "",
  category_id: "",
  brand_id: "",
  description: "",
  image_url: "",
  barcode: "",
  unit_label: "",
  mrp: 0,
  is_active: true,
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const UNIT_OPTIONS = [
  "1 pc",
  "2 pcs",
  "3 pcs",
  "4 pcs",
  "6 pcs",
  "10 pcs",
  "12 pcs",
  "1 pair",
  "1 set",
  "1 pack",
  "2 pack",
  "3 pack",
  "6 pack",
  "1 box",
  "1 pouch",
  "1 sachet",
  "1 bottle",
  "1 jar",
  "1 can",
  "1 tube",
  "1 bar",
  "1 roll",
  "1 strip",
  "1 sheet",
  "1 bag",
  "50 g",
  "100 g",
  "150 g",
  "200 g",
  "250 g",
  "500 g",
  "750 g",
  "1 kg",
  "2 kg",
  "5 kg",
  "10 kg",
  "25 kg",
  "50 ml",
  "100 ml",
  "200 ml",
  "250 ml",
  "500 ml",
  "750 ml",
  "1 L",
  "2 L",
  "5 L",
  "10 L",
  "6 eggs",
  "12 eggs",
  "250 mg",
  "500 mg",
  "1 tablet",
  "10 tablets",
  "15 tablets",
  "30 tablets",
];

function normalize(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function toPayload(values) {
  return {
    ...values,
    brand_id: values.brand_id || null,
    description: values.description || null,
    image_url: values.image_url || null,
    barcode: values.barcode || null,
  };
}

export default function ProductForm({ mode }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const product = useProduct(isEdit ? productId : null);
  const categories = useCategories();
  const brands = useBrands();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const uploadImage = useUploadProductImage();
  const [uploadError, setUploadError] = useState("");
  const [localPreview, setLocalPreview] = useState("");
  const [duplicateError, setDuplicateError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(productSchema), defaultValues: DEFAULTS });

  const watchedName = watch("name");
  const watchedCategory = watch("category_id");
  const watchedUnit = watch("unit_label");
  const watchedBarcode = watch("barcode");
  const imageUrl = watch("image_url");
  const duplicateNameSearch = normalize(watchedName);
  const duplicateBarcodeSearch = normalize(watchedBarcode);
  const duplicateNameProducts = useProducts(
    { q: duplicateNameSearch, limit: 8 },
    { enabled: duplicateNameSearch.length >= 2 },
  );
  const duplicateBarcodeProducts = useProducts(
    { q: duplicateBarcodeSearch, limit: 8 },
    { enabled: duplicateBarcodeSearch.length >= 2 },
  );

  const duplicateMatches = useMemo(() => {
    const name = normalize(watchedName);
    const unit = normalize(watchedUnit);
    const barcode = normalize(watchedBarcode);

    if (!name) return [];

    const candidates = new Map(
      [...(duplicateNameProducts.data ?? []), ...(duplicateBarcodeProducts.data ?? [])].map(
        (candidate) => [candidate.id, candidate],
      ),
    );

    return [...candidates.values()].filter((candidate) => {
      if (candidate.id === productId) return false;
      const sameCore =
        normalize(candidate.name) === name &&
        candidate.category_id === watchedCategory &&
        normalize(candidate.unit_label) === unit;
      const sameBarcode = barcode && normalize(candidate.barcode) === barcode;
      return sameCore || sameBarcode;
    });
  }, [
    duplicateBarcodeProducts.data,
    duplicateNameProducts.data,
    productId,
    watchedBarcode,
    watchedCategory,
    watchedName,
    watchedUnit,
  ]);
  const unitOptions = useMemo(() => {
    const current = String(watchedUnit ?? "").trim();
    return current && !UNIT_OPTIONS.includes(current)
      ? [current, ...UNIT_OPTIONS]
      : UNIT_OPTIONS;
  }, [watchedUnit]);

  useEffect(() => {
    if (duplicateMatches.length === 0) setDuplicateError(false);
  }, [duplicateMatches.length]);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  useEffect(() => {
    if (!product.data) return;
    reset({
      name: product.data.name ?? "",
      category_id: product.data.category_id ?? "",
      brand_id: product.data.brand_id ?? "",
      description: product.data.description ?? "",
      image_url: product.data.image_url ?? "",
      barcode: product.data.barcode ?? "",
      unit_label: product.data.unit_label ?? "",
      mrp: Number(product.data.mrp ?? 0),
      is_active: Boolean(product.data.is_active),
    });
  }, [product.data, reset]);

  if (isEdit && product.isPending) return <Skeleton className="h-[32rem]" />;
  if (isEdit && product.isError) {
    return (
      <Alert tone="error" title="Could not load product">
        {product.error?.message ?? "Please try again."}
      </Alert>
    );
  }

  const mutation = isEdit ? update : create;

  const handleImageFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setUploadError("Upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setUploadError("Product images must be 2 MB or smaller.");
      return;
    }

    setUploadError("");
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return previewUrl;
    });

    try {
      const uploaded = await uploadImage.mutateAsync(file);
      setValue("image_url", uploaded.public_url, { shouldDirty: true, shouldValidate: true });
      setLocalPreview("");
    } catch (error) {
      setUploadError(error?.message ?? "Could not upload image.");
    }
  };

  const onSubmit = async (values) => {
    if (duplicateMatches.length > 0) {
      setDuplicateError(true);
      return;
    }

    const body = toPayload(values);
    if (isEdit) await update.mutateAsync({ id: productId, body });
    else await create.mutateAsync(body);
    navigate("/products", { replace: true });
  };

  return (
    <div className="max-w-3xl">
      <Button as={Link} to="/products" variant="ghost" size="sm">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to products
      </Button>

      <h1 className="mt-4 text-heading text-ink">
        {isEdit ? "Edit product" : "Create product"}
      </h1>
      <p className="mt-1 text-body text-ink-muted">
        These are canonical product details. Store pricing and stock are managed separately.
      </p>

      <Card className="mt-6 p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
          {mutation.isError ? (
            <div className="sm:col-span-2">
              <Alert tone="error">{mutation.error?.message ?? "Could not save product."}</Alert>
            </div>
          ) : null}

          {duplicateMatches.length > 0 ? (
            <div className="sm:col-span-2">
              <Alert
                tone={duplicateError ? "error" : "warning"}
                title={duplicateError ? "This product already exists" : "Possible duplicate product"}
              >
                <span className="block">
                  Similar product already exists:{" "}
                  {duplicateMatches.slice(0, 2).map((item) => item.name).join(", ")}.
                </span>
                <span className="mt-1 block">
                  You cannot create the same catalogue product again. Open the existing product and edit it instead.
                </span>
              </Alert>
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <Field label="Name" required error={errors.name?.message}>
              {(field) => <TextInput {...field} {...register("name")} invalid={Boolean(errors.name)} />}
            </Field>
          </div>

          <Field label="Category" required error={errors.category_id?.message}>
            {(field) => (
              <SelectInput {...field} {...register("category_id")} invalid={Boolean(errors.category_id)}>
                <option value="">Choose category</option>
                {(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </SelectInput>
            )}
          </Field>

          <Field label="Brand" error={errors.brand_id?.message}>
            {(field) => (
              <SelectInput {...field} {...register("brand_id")} invalid={Boolean(errors.brand_id)}>
                <option value="">No brand</option>
                {(brands.data ?? []).map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </SelectInput>
            )}
          </Field>

          <Field label="Unit label" required error={errors.unit_label?.message}>
            {(field) => (
              <SelectInput {...field} {...register("unit_label")} invalid={Boolean(errors.unit_label)}>
                <option value="">Choose unit</option>
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>

          <Field label="MRP" required error={errors.mrp?.message}>
            {(field) => (
              <TextInput
                {...field}
                {...register("mrp")}
                invalid={Boolean(errors.mrp)}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
              />
            )}
          </Field>

          <Field label="Barcode" error={errors.barcode?.message}>
            {(field) => <TextInput {...field} {...register("barcode")} invalid={Boolean(errors.barcode)} />}
          </Field>

          <div className="sm:col-span-2">
            <div className="grid gap-4 rounded-card border border-line-soft bg-surface-sunken p-4 sm:grid-cols-[12rem_1fr]">
              <div className="flex h-40 items-center justify-center overflow-hidden rounded-card border border-line bg-surface">
                {localPreview || imageUrl ? (
                  <img
                    src={localPreview || imageUrl}
                    alt=""
                    className="size-full object-contain p-2"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="grid justify-items-center gap-2 text-center text-meta text-ink-muted">
                    <ImageIcon className="size-8" aria-hidden="true" />
                    Product image
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-card text-ink">Product image</p>
                <p className="mt-1 text-meta text-ink-muted">
                  Upload JPG, PNG, or WebP up to 2 MB. The saved URL remains editable for imported images.
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
                    <button
                      type="button"
                      onClick={() => setValue("image_url", "", { shouldDirty: true, shouldValidate: true })}
                      className="inline-flex h-9 items-center rounded-control px-3 text-meta font-semibold text-ink-soft hover:bg-surface hover:text-ink"
                    >
                      Remove image
                    </button>
                  ) : null}
                </div>

                {uploadError ? (
                  <p role="alert" className="mt-2 flex items-center gap-1.5 text-meta font-medium text-danger">
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                    {uploadError}
                  </p>
                ) : null}

                <div className="mt-4">
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
                </div>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Field label="Description" error={errors.description?.message}>
              {(field) => (
                <textarea
                  {...field}
                  {...register("description")}
                  rows={4}
                  className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-[0.9375rem] text-ink focus:border-primary focus:outline-none"
                />
              )}
            </Field>
          </div>

          <label className="inline-flex items-center gap-2 text-meta text-ink-soft">
            <input type="checkbox" {...register("is_active")} className="size-4 accent-[var(--color-primary)]" />
            Active in customer catalogue
          </label>

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button as={Link} to="/products" variant="secondary">Cancel</Button>
            <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
              {isEdit ? "Save product" : "Create product"}
            </Button>
          </div>
        </form>
      </Card>

      {isEdit && productId && (
        <ProductMediaSection productId={productId} />
      )}
    </div>
  );
}
