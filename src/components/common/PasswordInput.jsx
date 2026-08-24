import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/cn.js";

export default function PasswordInput({ className, invalid, showLabel = "Show password", hideLabel = "Hide password", ...props }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <span
      className={cn(
        "flex h-11 w-full min-w-0 items-center rounded-control border bg-surface pr-1 transition-colors focus-within:border-primary",
        invalid ? "border-danger" : "border-line",
        className,
      )}
    >
      <input
        type={visible ? "text" : "password"}
        className="min-w-0 flex-1 bg-transparent px-3 text-body text-ink outline-none placeholder:text-ink-muted"
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? hideLabel : showLabel}
        onClick={() => setVisible((current) => !current)}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-sunken hover:text-ink"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </span>
  );
}
