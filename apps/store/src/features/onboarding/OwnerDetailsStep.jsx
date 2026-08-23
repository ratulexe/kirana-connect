import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import Field, { TextInput } from "../../components/Field.jsx";
import Button from "../../components/Button.jsx";
import { zodResolver } from "../../lib/zodResolver.js";
import { ownerDetailsSchema } from "./schema.js";

export default function OwnerDetailsStep({ defaultValues, onNext }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(ownerDetailsSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-5">
      <Field label="Owner name" required error={errors.full_name?.message}>
        {(field) => (
          <TextInput
            {...field}
            {...register("full_name")}
            invalid={Boolean(errors.full_name)}
            autoComplete="name"
            placeholder="Ramesh Gupta"
          />
        )}
      </Field>

      <Field label="Owner phone" error={errors.phone?.message}>
        {(field) => (
          <TextInput
            {...field}
            {...register("phone")}
            invalid={Boolean(errors.phone)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="9820011223"
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
