import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import Skeleton from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import {
  useBusinessCategories,
  useCreateBusinessCategory,
  useUpdateBusinessCategory,
} from "../features/admin/useAdmin.js";
import { businessCategorySchema } from "../features/admin/schemas.js";
import { zodResolver } from "../lib/zodResolver.js";
import ProductCategoryMappings from "../features/admin/ProductCategoryMappings.jsx";

const DEFAULTS = { name: "", description: "", is_active: true };

function toPayload(values) {
  return { ...values, description: values.description || null };
}

function BusinessCategoryForm({ editing, onDone }) {
  const create = useCreateBusinessCategory();
  const update = useUpdateBusinessCategory();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(businessCategorySchema),
    defaultValues: editing
      ? {
          name: editing.name ?? "",
          description: editing.description ?? "",
          is_active: Boolean(editing.is_active),
        }
      : DEFAULTS,
  });
  const mutation = editing ? update : create;

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
            <Alert tone="error">{mutation.error?.message ?? "Could not save business category."}</Alert>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Field label="Name" required error={errors.name?.message}>
            {(field) => <TextInput {...field} {...register("name")} invalid={Boolean(errors.name)} />}
          </Field>
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
            {editing ? "Save business category" : "Create business category"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function BusinessCategories() {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const categories = useBusinessCategories();
  const update = useUpdateBusinessCategory();

  useEffect(() => {
    if (creating || editing) window.scrollTo({ top: 0, behavior: "auto" });
  }, [creating, editing]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading text-ink">Business categories</h1>
          <p className="mt-1 text-body text-ink-muted">
            The kind of business a store is (Grocery Store, Dairy Store, ...) -- separate from product categories.
            Used to classify stores for future competitor analysis.
          </p>
        </div>
        {!creating ? <Button onClick={() => setCreating(true)}>Create business category</Button> : null}
      </div>

      {(creating || editing) ? (
        <div className="mt-5">
          <BusinessCategoryForm
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
        <Alert tone="error" title="Could not load business categories" className="mt-6">
          {categories.error?.message ?? "Please try again."}
        </Alert>
      ) : (
        <div className="mt-6 divide-y divide-line-soft rounded-panel border border-line bg-surface">
          {categories.data.map((category) => (
            <article key={category.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-card text-ink">{category.name}</h2>
                  <StatusPill tone={category.is_active ? "success" : "neutral"}>
                    {category.is_active ? "Active" : "Inactive"}
                  </StatusPill>
                </div>
                <p className="mt-1 text-meta text-ink-muted">{category.description || "No description"}</p>
                <ProductCategoryMappings businessCategoryId={category.id} />
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
