import { useState } from "react";
import { useForm } from "react-hook-form";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import Skeleton from "../components/Skeleton.jsx";
import { useBrands, useCreateBrand, useUpdateBrand } from "../features/admin/useAdmin.js";
import { brandSchema } from "../features/admin/schemas.js";
import { zodResolver } from "../lib/zodResolver.js";

const DEFAULTS = { name: "", logo_url: "" };

function BrandForm({ editing, onDone }) {
  const create = useCreateBrand();
  const update = useUpdateBrand();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: editing ? { name: editing.name ?? "", logo_url: editing.logo_url ?? "" } : DEFAULTS,
  });
  const mutation = editing ? update : create;

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
        <Field label="Logo URL" error={errors.logo_url?.message}>
          {(field) => <TextInput {...field} {...register("logo_url")} invalid={Boolean(errors.logo_url)} />}
        </Field>
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
        <div className="mt-6 divide-y divide-line-soft rounded-panel border border-line bg-surface">
          {brands.data.map((brand) => (
            <article key={brand.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h2 className="text-card text-ink">{brand.name}</h2>
                <p className="mt-1 text-meta text-ink-muted">{brand.logo_url || "No logo URL"}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEditing(brand)}>Edit</Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
