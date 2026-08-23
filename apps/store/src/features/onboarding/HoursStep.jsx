import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, CopyCheck } from "lucide-react";
import Button from "../../components/Button.jsx";
import { zodResolver } from "../../lib/zodResolver.js";
import { hoursSchema, DAY_LABELS } from "./schema.js";

/** Monday, so "copy to weekdays" has an obvious source row. */
const TEMPLATE_DAY = 1;
const WEEKDAYS = [1, 2, 3, 4, 5];

export default function HoursStep({ defaultValues, onNext, onBack }) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(hoursSchema), defaultValues });

  const hours = useWatch({ control, name: "hours" }) ?? [];

  const copyMondayToWeekdays = () => {
    const monday = getValues(`hours.${TEMPLATE_DAY}`);
    for (const day of WEEKDAYS) {
      if (day === TEMPLATE_DAY) continue;
      setValue(`hours.${day}.is_closed`, monday.is_closed, { shouldDirty: true });
      setValue(`hours.${day}.opens_at`, monday.opens_at, { shouldDirty: true });
      setValue(`hours.${day}.closes_at`, monday.closes_at, { shouldDirty: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-meta text-ink-muted">
          Set the hours you are usually open. You can change these later.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={copyMondayToWeekdays}>
          <CopyCheck className="size-4" aria-hidden="true" />
          Copy Monday to weekdays
        </Button>
      </div>

      <ul className="divide-y divide-line-soft rounded-card border border-line bg-surface">
        {DAY_LABELS.map((label, day) => {
          const isClosed = hours[day]?.is_closed ?? false;
          const dayError = errors.hours?.[day];

          return (
            <li key={label} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
              <span className="w-24 shrink-0 text-card text-ink">{label}</span>

              <label className="inline-flex cursor-pointer items-center gap-2 text-meta text-ink-soft">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-primary)]"
                  {...register(`hours.${day}.is_closed`)}
                />
                Closed
              </label>

              <input type="hidden" {...register(`hours.${day}.day_of_week`, { valueAsNumber: true })} />

              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`open-${day}`}>
                  {label} opening time
                </label>
                <input
                  id={`open-${day}`}
                  type="time"
                  disabled={isClosed}
                  aria-invalid={dayError ? true : undefined}
                  className="rounded-control border border-line bg-surface px-3 py-2 text-meta text-ink tabular-nums disabled:opacity-45"
                  {...register(`hours.${day}.opens_at`)}
                />
                <span aria-hidden="true" className="text-ink-muted">
                  to
                </span>
                <label className="sr-only" htmlFor={`close-${day}`}>
                  {label} closing time
                </label>
                <input
                  id={`close-${day}`}
                  type="time"
                  disabled={isClosed}
                  aria-invalid={dayError ? true : undefined}
                  className="rounded-control border border-line bg-surface px-3 py-2 text-meta text-ink tabular-nums disabled:opacity-45"
                  {...register(`hours.${day}.closes_at`)}
                />
              </div>

              {dayError ? (
                <p role="alert" className="w-full text-meta font-medium text-danger">
                  {dayError.opens_at?.message ??
                    dayError.closes_at?.message ??
                    "Check this day's hours"}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <Button type="submit">
          Review
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
