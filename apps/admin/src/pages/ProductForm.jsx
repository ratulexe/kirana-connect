import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Field, { SelectInput, TextInput } from "../components/Field.jsx";
import Skeleton from "../components/Skeleton.jsx";
import {
  useBrands,
  useCategories,
  useCreateProduct,
  useProduct,
  useUpdateProduct,
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(productSchema), defaultValues: DEFAULTS });

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

  const onSubmit = async (values) => {
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
            {(field) => <TextInput {...field} {...register("unit_label")} invalid={Boolean(errors.unit_label)} placeholder="500 g" />}
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

          <Field label="Image URL" error={errors.image_url?.message}>
            {(field) => <TextInput {...field} {...register("image_url")} invalid={Boolean(errors.image_url)} />}
          </Field>

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
    </div>
  );
}
