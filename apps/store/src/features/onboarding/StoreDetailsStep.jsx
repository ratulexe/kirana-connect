import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import Field, { TextInput, TextArea } from "../../components/Field.jsx";
import Button from "../../components/Button.jsx";
import { zodResolver } from "../../lib/zodResolver.js";
import { storeDetailsSchema } from "./schema.js";

export default function StoreDetailsStep({ defaultValues, onNext }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(storeDetailsSchema), defaultValues });

  const phoneField = register("phone");

  // Sanitizes on every keystroke rather than only validating on submit: a
  // resolver-driven form only surfaces errors.phone after the fact, which
  // would let non-digit characters or an 11th digit sit in the field.
  const onPhoneChange = (event) => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10);
    phoneField.onChange(event);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-5">
      <Field label="Store name" required error={errors.name?.message}>
        {(field) => (
          <TextInput
            {...field}
            {...register("name")}
            invalid={Boolean(errors.name)}
            placeholder="Enter your store name"
            autoComplete="organization"
          />
        )}
      </Field>

      <Field
        label="What your store is known for"
        hint="A sentence or two. Customers see this on your store page."
        error={errors.description?.message}
      >
        {(field) => (
          <TextArea
            {...field}
            {...register("description")}
            invalid={Boolean(errors.description)}
            placeholder="Daily groceries, fresh dairy and household supplies since 1998."
          />
        )}
      </Field>

      <Field
        label="Store phone"
        hint="Shown to customers who want to check stock before visiting."
        error={errors.phone?.message}
      >
        {(field) => (
          <TextInput
            {...field}
            {...phoneField}
            onChange={onPhoneChange}
            invalid={Boolean(errors.phone)}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter your phone number"
            autoComplete="tel"
          />
        )}
      </Field>

      <div className="flex justify-end pt-1">
        <Button type="submit">
          Continue
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
