import { lazy, Suspense } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Field, { TextInput } from "../../components/Field.jsx";
import Button from "../../components/Button.jsx";
import { zodResolver } from "../../lib/zodResolver.js";
import { addressSchema } from "./schema.js";

// Leaflet is a large dependency and only this step needs it, so it is kept
// out of the initial bundle that the landing and sign-in screens pay for.
const LocationPicker = lazy(() => import("./LocationPicker.jsx"));

export default function AddressStep({ defaultValues, onNext, onBack }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(addressSchema), defaultValues });

  // Coordinates come from the map rather than a text field, so they are held in
  // form state directly and validated by the same schema as everything else.
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  const handlePick = (lat, lng) => {
    setValue("latitude", lat, { shouldValidate: true, shouldDirty: true });
    setValue("longitude", lng, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-5">
      <Field label="Address line 1" required error={errors.address_line_1?.message}>
        {(field) => (
          <TextInput
            {...field}
            {...register("address_line_1")}
            invalid={Boolean(errors.address_line_1)}
            placeholder="Shop 4, Gokul Arcade, Subhash Road"
            autoComplete="address-line1"
          />
        )}
      </Field>

      <Field label="Address line 2" error={errors.address_line_2?.message}>
        {(field) => (
          <TextInput
            {...field}
            {...register("address_line_2")}
            invalid={Boolean(errors.address_line_2)}
            placeholder="Near the bus depot"
            autoComplete="address-line2"
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Locality or area" required error={errors.locality?.message}>
          {(field) => (
            <TextInput
              {...field}
              {...register("locality")}
              invalid={Boolean(errors.locality)}
              placeholder="Andheri East"
            />
          )}
        </Field>

        <Field label="City" required error={errors.city?.message}>
          {(field) => (
            <TextInput
              {...field}
              {...register("city")}
              invalid={Boolean(errors.city)}
              placeholder="Mumbai"
              autoComplete="address-level2"
            />
          )}
        </Field>

        <Field label="State" required error={errors.state?.message}>
          {(field) => (
            <TextInput
              {...field}
              {...register("state")}
              invalid={Boolean(errors.state)}
              placeholder="Maharashtra"
              autoComplete="address-level1"
            />
          )}
        </Field>

        <Field label="Postal code" required error={errors.postal_code?.message}>
          {(field) => (
            <TextInput
              {...field}
              {...register("postal_code")}
              invalid={Boolean(errors.postal_code)}
              inputMode="numeric"
              placeholder="400069"
              autoComplete="postal-code"
            />
          )}
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3 border-t border-line-soft pt-5">
        <legend className="sr-only">Store location on the map</legend>
        <div>
          <h3 className="text-card text-ink">Pin your exact location</h3>
          <p className="mt-1 text-meta text-ink-muted">
            Customers search by how close a shop is, so an accurate pin matters more
            than the written address.
          </p>
        </div>

        <Suspense
          fallback={
            <div
              className="h-64 animate-pulse rounded-card border border-line bg-surface-sunken sm:h-72"
              aria-hidden="true"
            />
          }
        >
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onChange={handlePick}
            error={errors.latitude?.message ?? errors.longitude?.message}
          />
        </Suspense>
      </fieldset>

      <div className="flex flex-wrap justify-between gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <Button type="submit">
          Continue
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
