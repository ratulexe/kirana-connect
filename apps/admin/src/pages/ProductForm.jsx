import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
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
  useResolveProductImage,
  useUpdateProduct,
  useUploadProductImage,
} from "../features/admin/useAdmin.js";
import { productSchema, UNIT_OPTIONS } from "../features/admin/schemas.js";
import { zodResolver } from "../lib/zodResolver.js";

const EMPTY_VARIANT = {
  quantity: 500,
  unit_code: "g",
  mrp: 0,
  barcode: "",
  image_url: "",
  is_active: true,
};

const DEFAULTS = {
  name: "",
  category_id: "",
  brand_id: "",
  description: "",
  image_url: "",
  variants: [EMPTY_VARIANT],
  is_active: true,
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function productNameTokens(value) {
  return normalize(value).split(" ").filter((token) => token.length >= 3);
}

function isLikelyDuplicateProduct(candidate, values) {
  const name = normalize(values.name);
  const candidateName = normalize(candidate?.name);
  if (!name || !candidateName) return false;
  if (candidate.category_id !== values.categoryId) return false;
  if ((candidate.brand_id ?? "") !== (values.brandId || "")) return false;
  if (candidateName === name) return true;
  if (name.length >= 4 && (candidateName.includes(name) || name.includes(candidateName))) return true;

  const nameTokens = productNameTokens(name);
  if (nameTokens.length < 2) return false;

  const candidateTokens = new Set(productNameTokens(candidateName));
  const matchedTokens = nameTokens.filter((token) => candidateTokens.has(token));
  return matchedTokens.length >= 2;
}

function firstErrorMessage(errors) {
  if (!errors || typeof errors !== "object") return "";
  if (typeof errors.message === "string") return errors.message;

  for (const value of Object.values(errors)) {
    const message = firstErrorMessage(value);
    if (message) return message;
  }

  return "";
}

function quantityLabel(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 3,
    useGrouping: false,
  }).format(number);
}

function unitLabel(code) {
  return UNIT_OPTIONS.find((unit) => unit.code === code)?.label ?? code;
}

function variantLabel(variant) {
  return `${quantityLabel(variant?.quantity)} ${unitLabel(variant?.unit_code)}`.trim();
}

function variantSizeKey(variant) {
  const quantity = Number(variant?.quantity);
  const unitCode = variant?.unit_code;
  if (!Number.isFinite(quantity) || quantity <= 0 || !unitCode) return "";
  return `${quantity}:${unitCode}`;
}

function cleanVariantId(value) {
  const id = String(value ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : undefined;
}

function toPayload(values) {
  return {
    ...values,
    brand_id: values.brand_id || null,
    description: values.description || null,
    image_url: values.image_url || null,
    variants: values.variants.map((variant) => ({
      ...variant,
      id: cleanVariantId(variant.id),
      barcode: variant.barcode || null,
      image_url: variant.image_url || null,
    })),
  };
}

function ImagePreview({ src, name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div className="flex h-40 items-center justify-center overflow-hidden rounded-card border border-line bg-surface">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="size-full object-contain p-2"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid justify-items-center gap-2 text-center text-meta text-ink-muted">
          <ImageIcon className="size-8" aria-hidden="true" />
          {name || "Product image"}
        </div>
      )}
    </div>
  );
}

function DuplicateProductDialog({ match, onClose }) {
  if (!match) return null;

  const sizes = (match.variants ?? []).map(variantLabel).filter(Boolean);
  const sizeSummary = sizes.length > 0 ? ` Existing sizes: ${sizes.join(", ")}.` : "";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-product-title"
        className="w-full max-w-md rounded-card border border-danger/25 bg-white p-5 shadow-xl"
      >
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="duplicate-product-title" className="text-section text-ink">
              Product already exists
            </h2>
            <p className="mt-2 text-body text-ink-muted">
              {match.name} is already in this brand and category.{sizeSummary} Open the existing product
              and add another pack size there.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Keep editing
          </Button>
          <Button as={Link} to={`/products/${match.id}/edit`}>
            Open existing product
          </Button>
        </div>
      </div>
    </div>
  );
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
  const resolveImage = useResolveProductImage();
  const [uploadError, setUploadError] = useState("");
  const [localPreview, setLocalPreview] = useState("");
  const [duplicateError, setDuplicateError] = useState(false);
  const [imageResolveError, setImageResolveError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(productSchema), defaultValues: DEFAULTS });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  const watchedName = watch("name");
  const watchedCategory = watch("category_id");
  const watchedBrand = watch("brand_id");
  const watchedVariants = watch("variants");
  const imageUrl = watch("image_url");
  const duplicateNameSearch = normalize(watchedName);
  const duplicateNameProducts = useProducts(
    { q: duplicateNameSearch, limit: 8 },
    { enabled: !isEdit && duplicateNameSearch.length >= 2 },
  );

  const duplicateMatches = useMemo(() => {
    if (isEdit || !normalize(watchedName) || !watchedCategory) return [];

    return (duplicateNameProducts.data ?? []).filter((candidate) => {
      if (candidate.id === productId) return false;
      return isLikelyDuplicateProduct(candidate, {
        name: watchedName,
        categoryId: watchedCategory,
        brandId: watchedBrand,
      });
    });
  }, [duplicateNameProducts.data, isEdit, productId, watchedBrand, watchedCategory, watchedName]);

  const duplicateMatch = duplicateMatches[0] ?? null;

  const duplicateVariantIssues = useMemo(() => {
    const bySize = new Map();
    (watchedVariants ?? []).forEach((variant, index) => {
      const key = variantSizeKey(variant);
      if (!key) return;
      const entry = bySize.get(key) ?? { label: variantLabel(variant), indexes: [] };
      entry.indexes.push(index);
      bySize.set(key, entry);
    });

    return [...bySize.values()].filter((entry) => entry.indexes.length > 1);
  }, [watchedVariants]);

  const duplicateVariantLabels = duplicateVariantIssues.map((issue) => issue.label);
  const duplicateVariantIndexes = useMemo(
    () => new Set(duplicateVariantIssues.flatMap((issue) => issue.indexes)),
    [duplicateVariantIssues],
  );

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
      variants: (product.data.variants?.length ? product.data.variants : [product.data]).map((variant) => ({
        id: variant.id,
        quantity: Number(variant.quantity ?? 1),
        unit_code: variant.unit_code ?? "pc",
        mrp: Number(variant.mrp ?? 0),
        barcode: variant.barcode ?? "",
        image_url: variant.image_url ?? "",
        is_active: Boolean(variant.is_active ?? true),
      })),
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

  const resolveImageField = async (path, value) => {
    setImageResolveError("");
    try {
      const resolved = await resolveImage.mutateAsync(value);
      setValue(path, resolved.resolved_url, { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      setImageResolveError(error?.message ?? "Could not resolve that image URL.");
    }
  };

  const onSubmit = async (values) => {
    setSubmitError("");
    if (duplicateMatches.length > 0) {
      setDuplicateError(true);
      setSubmitError("This product already exists. Open the existing product to add or edit sizes.");
      return;
    }
    if (duplicateVariantLabels.length > 0) {
      setSubmitError(`${duplicateVariantLabels.join(", ")} appears more than once.`);
      return;
    }

    try {
      const body = toPayload(values);
      if (isEdit) {
        await update.mutateAsync({ id: productId, body });
        navigate("/products", { replace: true });
        return;
      }

      const created = await create.mutateAsync(body);
      const newProductId = created?.data?.id;
      navigate(newProductId ? `/products/${newProductId}/edit` : "/products", { replace: true });
    } catch (error) {
      setSubmitError(error?.message ?? "Could not save product. Please try again.");
    }
  };

  const onInvalidSubmit = (formErrors) => {
    setSubmitError(firstErrorMessage(formErrors) || "Fix the highlighted fields before saving.");
  };

  const addVariant = () => {
    const usedSizes = new Set((watchedVariants ?? []).map(variantSizeKey).filter(Boolean));
    const suggestions = [
      { quantity: 500, unit_code: "g" },
      { quantity: 100, unit_code: "g" },
      { quantity: 200, unit_code: "g" },
      { quantity: 250, unit_code: "g" },
      { quantity: 1, unit_code: "kg" },
      { quantity: 500, unit_code: "ml" },
      { quantity: 1, unit_code: "l" },
      { quantity: 1, unit_code: "pc" },
    ];
    const nextSize = suggestions.find((variant) => !usedSizes.has(variantSizeKey(variant))) ?? EMPTY_VARIANT;
    append({ ...EMPTY_VARIANT, ...nextSize });
  };

  return (
    <div className="max-w-4xl">
      <Button as={Link} to="/products" variant="ghost" size="sm">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to products
      </Button>

      <h1 className="mt-4 text-heading text-ink">
        {isEdit ? "Edit product" : "Create product"}
      </h1>
      <p className="mt-1 text-body text-ink-muted">
        Create one base product, then add the sizes customers can compare across stores.
      </p>

      <Card className="mt-6 p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} noValidate className="grid gap-6">
          {mutation.isError ? (
            <Alert tone="error" title={isEdit ? "Could not update product" : "Could not create product"}>
              {mutation.error?.message ?? "Could not save product."}
            </Alert>
          ) : null}

          {duplicateMatch ? (
            <Alert
              tone={duplicateError ? "error" : "warning"}
              title={duplicateError ? "This product already exists" : "Possible existing product"}
            >
              <span className="block">
                Matching product: {duplicateMatch.name}. Use that product for more sizes instead of creating
                another base product.
              </span>
              <Button
                as={Link}
                to={`/products/${duplicateMatch.id}/edit`}
                variant="secondary"
                size="sm"
                className="mt-3"
              >
                Open existing product
              </Button>
            </Alert>
          ) : null}

          {duplicateVariantIssues.length > 0 ? (
            <Alert tone="error" title="Duplicate variant size">
              {duplicateVariantIssues.map((issue) => (
                <span key={issue.label} className="block">
                  {issue.label} is used in {issue.indexes.map((index) => `Variant ${index + 1}`).join(" and ")}.
                </span>
              ))}
              <span className="mt-1 block">Change one size or remove the extra new variant before saving.</span>
            </Alert>
          ) : null}

          <section aria-labelledby="base-product-heading" className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h2 id="base-product-heading" className="text-section text-ink">Base product</h2>
            </div>

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

            <div className="sm:col-span-2">
              <div className="grid gap-4 rounded-card border border-line-soft bg-surface-sunken p-4 sm:grid-cols-[12rem_1fr]">
                <ImagePreview src={localPreview || imageUrl} name={watchedName} />

                <div className="min-w-0">
                  <p className="text-card text-ink">Base image</p>
                  <p className="mt-1 text-meta text-ink-muted">
                    Upload storage images when available, or resolve a direct/Pinterest URL before saving.
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
                      onClick={() => resolveImageField("image_url", imageUrl)}
                    >
                      Resolve preview
                    </Button>
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
          </section>

          <section aria-labelledby="variants-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="variants-heading" className="text-section text-ink">Variants</h2>
                <p className="mt-1 text-meta text-ink-muted">
                  Each row is one independently sellable size.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={addVariant}>
                <Plus className="size-4" aria-hidden="true" />
                Add another variant
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {fields.map((field, index) => {
                const variant = watchedVariants?.[index] ?? {};
                const isDuplicateVariant = duplicateVariantIndexes.has(index);
                return (
                  <div
                    key={field.id}
                    className={`rounded-card border p-4 ${
                      isDuplicateVariant ? "border-danger/35 bg-danger-soft/35" : "border-line bg-canvas"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-card text-ink">
                          Variant {index + 1}
                          {variantLabel(variant) ? ` · ${variantLabel(variant)}` : ""}
                        </p>
                        {isDuplicateVariant ? (
                          <p className="mt-1 text-meta font-medium text-danger">
                            This size is repeated on another variant.
                          </p>
                        ) : null}
                      </div>
                      {fields.length > 1 && !variant.id ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Remove
                        </Button>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <input type="hidden" {...register(`variants.${index}.id`)} />
                      <Field label="Quantity" required error={errors.variants?.[index]?.quantity?.message}>
                        {(input) => (
                          <TextInput
                            {...input}
                            {...register(`variants.${index}.quantity`)}
                            invalid={Boolean(errors.variants?.[index]?.quantity)}
                            type="number"
                            min="0.001"
                            step="0.001"
                            inputMode="decimal"
                          />
                        )}
                      </Field>

                      <Field label="Unit" required error={errors.variants?.[index]?.unit_code?.message}>
                        {(input) => (
                          <SelectInput
                            {...input}
                            {...register(`variants.${index}.unit_code`)}
                            invalid={Boolean(errors.variants?.[index]?.unit_code)}
                          >
                            {UNIT_OPTIONS.map((unit) => (
                              <option key={unit.code} value={unit.code}>{unit.label}</option>
                            ))}
                          </SelectInput>
                        )}
                      </Field>

                      <Field label="MRP" required error={errors.variants?.[index]?.mrp?.message}>
                        {(input) => (
                          <TextInput
                            {...input}
                            {...register(`variants.${index}.mrp`)}
                            invalid={Boolean(errors.variants?.[index]?.mrp)}
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                          />
                        )}
                      </Field>

                      <Field label="Barcode" error={errors.variants?.[index]?.barcode?.message}>
                        {(input) => (
                          <TextInput
                            {...input}
                            {...register(`variants.${index}.barcode`)}
                            invalid={Boolean(errors.variants?.[index]?.barcode)}
                          />
                        )}
                      </Field>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                      <Field label="Variant image URL" error={errors.variants?.[index]?.image_url?.message}>
                        {(input) => (
                          <TextInput
                            {...input}
                            {...register(`variants.${index}.image_url`)}
                            invalid={Boolean(errors.variants?.[index]?.image_url)}
                            placeholder="Optional"
                          />
                        )}
                      </Field>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={!variant.image_url || resolveImage.isPending}
                        onClick={() => resolveImageField(`variants.${index}.image_url`, variant.image_url)}
                      >
                        Resolve preview
                      </Button>
                      <label className="inline-flex h-10 items-center gap-2 text-meta text-ink-soft">
                        <input
                          type="checkbox"
                          {...register(`variants.${index}.is_active`)}
                          className="size-4 accent-[var(--color-primary)]"
                        />
                        Active
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {imageResolveError ? <Alert tone="error">{imageResolveError}</Alert> : null}

          <label className="inline-flex items-center gap-2 text-meta text-ink-soft">
            <input type="checkbox" {...register("is_active")} className="size-4 accent-[var(--color-primary)]" />
            Active in customer catalogue
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {submitError ? (
              <p role="alert" className="mr-auto self-center text-meta font-medium text-danger">
                {submitError}
              </p>
            ) : null}
            <Button as={Link} to="/products" variant="secondary">Cancel</Button>
            <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
              {isEdit ? "Save product" : "Create product"}
            </Button>
          </div>
        </form>
      </Card>

      {duplicateError && duplicateMatch ? (
        <DuplicateProductDialog match={duplicateMatch} onClose={() => setDuplicateError(false)} />
      ) : null}

      {isEdit && productId ? (
        <ProductMediaSection productId={productId} />
      ) : (
        <Card className="mt-6 p-5">
          <h2 className="text-card text-ink">Pack images</h2>
          <p className="mt-1 text-meta text-ink-muted">
            Save the product first, then add front, back side, nutrition facts, and promotional images.
          </p>
        </Card>
      )}
    </div>
  );
}
