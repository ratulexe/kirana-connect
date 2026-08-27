import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ShoppingBasket, X } from "lucide-react";
import Alert from "./Alert.jsx";
import Button from "./Button.jsx";
import Field, { TextInput } from "./Field.jsx";
import PasswordInput from "./PasswordInput.jsx";
import { cn } from "../../lib/cn.js";
import { useAuth } from "../../auth/useAuth.js";
import { friendlyAuthMessage } from "../../auth/authMessages.js";
import { loginSchema, registerSchema } from "../../features/customer/schemas.js";
import { zodResolver } from "../../lib/zodResolver.js";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Matches the panel's transition-transform/opacity duration below -- keep
// these in sync so the drawer unmounts only once it has actually finished
// sliding out.
const TRANSITION_MS = 300;

function SignInForm({ auth, onClose, onSwitchToRegister }) {
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (values) => {
    setFormError("");
    try {
      await auth.signIn(values);
      onClose();
    } catch (error) {
      setFormError(friendlyAuthMessage(error));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <Field label="Email" required error={errors.email?.message}>
          {(field) => (
            <TextInput
              {...field}
              {...register("email")}
              invalid={Boolean(errors.email)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          )}
        </Field>

        <Field label="Password" required error={errors.password?.message}>
          {(field) => (
            <PasswordInput
              {...field}
              {...register("password")}
              invalid={Boolean(errors.password)}
              autoComplete="current-password"
            />
          )}
        </Field>

        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Continue"}
        </Button>

        <Link
          to="/forgot-password"
          onClick={onClose}
          className="text-center text-meta font-semibold text-primary hover:text-primary-hover"
        >
          Forgot password
        </Link>
      </form>

      <div className="mt-7 border-t border-line-soft pt-5 text-center text-meta text-ink-muted">
        New to Kirana Connect?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Create account
        </button>
      </div>
    </>
  );
}

function RegisterForm({ auth, onClose, onSwitchToSignIn }) {
  const [formError, setFormError] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values) => {
    setFormError("");
    setConfirmationEmail("");
    try {
      const result = await auth.signUp(values);
      if (result.needsEmailConfirmation) {
        setConfirmationEmail(values.email);
      } else {
        onClose();
      }
    } catch (error) {
      setFormError(friendlyAuthMessage(error));
    }
  };

  if (confirmationEmail) {
    return (
      <Alert tone="success" title="Check your email">
        We sent a confirmation link to {confirmationEmail}. After confirming, sign in to use saved addresses.
      </Alert>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <Field label="Full name" required error={errors.fullName?.message}>
          {(field) => (
            <TextInput {...field} {...register("fullName")} invalid={Boolean(errors.fullName)} autoComplete="name" />
          )}
        </Field>

        <Field label="Email" required error={errors.email?.message}>
          {(field) => (
            <TextInput
              {...field}
              {...register("email")}
              invalid={Boolean(errors.email)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          )}
        </Field>

        <Field label="Phone" error={errors.phone?.message} hint="Optional, used only on your customer profile.">
          {(field) => (
            <TextInput
              {...field}
              {...register("phone")}
              invalid={Boolean(errors.phone)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
          )}
        </Field>

        <Field label="Password" required error={errors.password?.message}>
          {(field) => (
            <PasswordInput
              {...field}
              {...register("password")}
              invalid={Boolean(errors.password)}
              autoComplete="new-password"
            />
          )}
        </Field>

        <Field label="Confirm password" required error={errors.confirmPassword?.message}>
          {(field) => (
            <PasswordInput
              {...field}
              {...register("confirmPassword")}
              invalid={Boolean(errors.confirmPassword)}
              autoComplete="new-password"
              showLabel="Show confirmation password"
              hideLabel="Hide confirmation password"
            />
          )}
        </Field>

        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="mt-7 border-t border-line-soft pt-5 text-center text-meta text-ink-muted">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Sign in
        </button>
      </div>
    </>
  );
}

const COPY = {
  signin: {
    heading: "Sign in",
    body: "Access saved locations and your Kirana Connect account.",
  },
  register: {
    heading: "Create account",
    body: "Save places you love and make every shopping run easier.",
  },
};

/**
 * Right-side sign-in / create-account drawer for the consumer header. A
 * dedicated component rather than a reuse of Modal.jsx: Modal centers a
 * small dialog and only animates in (see modal-in/-fade-in keyframes),
 * where this needs a slide from the right edge that also animates back out
 * before it unmounts, and switches between two forms in place.
 *
 * Effect stability: every effect below keys off the `open` boolean alone.
 * `onClose` is read through a ref (updated on every render, never listed as
 * a dependency) so a caller passing a fresh inline handler each render --
 * exactly how SiteHeader uses this -- can never cause these effects to tear
 * down and re-run mid-interaction. That was the root of the earlier drawer
 * bug class: an effect keyed on an unstable callback re-fires on every
 * parent render, which re-runs the focus/scroll-lock setup and can steal
 * focus back out of whatever the user is typing into.
 */
export default function AuthDrawer({ open, onClose }) {
  const auth = useAuth();
  const titleId = useId();
  const [shouldRender, setShouldRender] = useState(false);
  const [entered, setEntered] = useState(false);
  const [mode, setMode] = useState("signin");

  const dialogRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const exitTimeoutRef = useRef(null);
  const enterTimeoutRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Mount on open, unmount only after the exit transition finishes. A
  // setTimeout (rather than requestAnimationFrame) flips the panel from
  // translate-x-full to translate-x-0: rAF callbacks can be starved
  // indefinitely while the tab/pane isn't actively compositing frames, which
  // would leave the drawer permanently off-screen after "opening".
  useEffect(() => {
    if (open) {
      window.clearTimeout(exitTimeoutRef.current);
      setShouldRender(true);
      enterTimeoutRef.current = window.setTimeout(() => setEntered(true), 20);
      return () => window.clearTimeout(enterTimeoutRef.current);
    }

    setEntered(false);
    exitTimeoutRef.current = window.setTimeout(() => setShouldRender(false), TRANSITION_MS);
    return () => window.clearTimeout(exitTimeoutRef.current);
  }, [open]);

  // Always start fresh on sign-in each time the drawer is opened -- the
  // per-mode form components below carry their own field/error state and
  // remount (discarding it) whenever `mode` changes or the drawer unmounts.
  useEffect(() => {
    if (!open) return undefined;
    setMode("signin");
    return undefined;
  }, [open]);

  // Capture the trigger on open, restore focus to it as soon as closing
  // starts (no need to wait for the exit animation).
  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement;
      return undefined;
    }
    if (lastFocusedRef.current instanceof HTMLElement) {
      lastFocusedRef.current.focus();
    }
    return undefined;
  }, [open]);

  // Focus the form's first field once the drawer (re)renders -- not simply
  // the first focusable node, which would be the close button that sits
  // above the form in markup order. Re-runs on mode change too, so
  // switching to "Create account" focuses its first field as well.
  useEffect(() => {
    if (!shouldRender) return undefined;
    const dialog = dialogRef.current;
    const firstField = dialog?.querySelector("form input");
    (firstField ?? dialog)?.focus();
    return undefined;
  }, [shouldRender, mode]);

  // Escape to close, Tab/Shift+Tab trapped inside the dialog.
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      const nodes = dialog?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!nodes || nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open]);

  // Lock body scroll while open, restore on close.
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!shouldRender) return null;

  const copy = COPY[mode];

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div
        className={cn(
          "absolute inset-0 bg-[rgba(17,24,39,0.28)] backdrop-blur-[2px] transition-opacity duration-300 ease-brand",
          entered ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex h-full w-full flex-col overflow-y-auto bg-surface shadow-float outline-none",
          "transition-transform duration-300 ease-brand sm:w-auto sm:max-w-[440px] sm:min-w-[420px] sm:rounded-l-panel",
          entered ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start justify-between px-5 pt-5 sm:px-7 sm:pt-7">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ShoppingBasket className="size-5" aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${copy.heading.toLowerCase()}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pb-8 pt-4 sm:px-7">
          <h2 id={titleId} className="text-heading text-ink">
            {copy.heading}
          </h2>
          <p className="mt-2 text-body text-ink-muted">{copy.body}</p>

          <div className="mt-6">
            {!auth.isConfigured ? (
              <Alert tone="error" title="Consumer auth is not configured">
                Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the consumer environment.
              </Alert>
            ) : mode === "signin" ? (
              <SignInForm auth={auth} onClose={onClose} onSwitchToRegister={() => setMode("register")} />
            ) : (
              <RegisterForm auth={auth} onClose={onClose} onSwitchToSignIn={() => setMode("signin")} />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
