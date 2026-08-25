import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowRight, MailCheck } from "lucide-react";
import Container from "../components/Container.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import Stepper from "../components/Stepper.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import { useAuth } from "../auth/useAuth.js";
import { zodResolver } from "../lib/zodResolver.js";
import { accountSchema } from "../features/onboarding/schema.js";
import { WIZARD_STEPS } from "../features/onboarding/steps.js";

function friendlyMessage(error) {
  const raw = String(error?.message ?? "").toLowerCase();
  if (raw.includes("already registered") || raw.includes("already been registered")) {
    return "An account already exists for this email. Sign in instead.";
  }
  if (raw.includes("password")) {
    return "That password was rejected. Use at least 8 characters with a letter and a number.";
  }
  if (raw.includes("rate limit") || raw.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Could not create your account. Please try again.";
}

/**
 * Step 1 of registration: the account itself.
 *
 * The owner's name and phone are saved as normal profile metadata. Role is not:
 * every new account is a customer until an admin promotes it.
 */
export default function Register() {
  const { signUp, isAuthenticated, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", phone: "" },
  });

  // Already signed in: the account step is done, go straight to the store.
  if (isAuthenticated) return <Navigate to="/onboarding" replace />;

  const onSubmit = async (values) => {
    setFormError("");
    try {
      const { needsEmailConfirmation } = await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
      });

      // Carry the owner details forward so the wizard can prefill them without
      // ever putting them in a token or in signup metadata.
      sessionStorage.setItem(
        "kc-store-owner",
        JSON.stringify({ full_name: values.fullName, phone: values.phone }),
      );

      if (needsEmailConfirmation) {
        setPendingEmail(values.email);
        return;
      }

      navigate("/onboarding", { replace: true });
    } catch (error) {
      setFormError(friendlyMessage(error));
    }
  };

  if (pendingEmail) {
    return (
      <Container className="py-12 sm:py-16">
        <Card className="mx-auto max-w-md p-6 text-center">
          <span className="mx-auto inline-flex size-11 items-center justify-center rounded-pill bg-primary-soft text-primary">
            <MailCheck className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-section text-ink">Check your email</h1>
          <p className="mt-2 text-body text-ink-muted">
            We sent a confirmation link to <span className="font-semibold text-ink">{pendingEmail}</span>.
            Open it to activate your account, then sign in to finish registering your store.
          </p>
          <Button as={Link} to="/login" variant="secondary" className="mt-6">
            Go to sign in
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Stepper steps={WIZARD_STEPS} currentIndex={0} />

        <h1 className="mt-5 text-heading text-ink">Create your account</h1>
        <p className="mt-2 text-body text-ink-muted">
          One account manages your store listing.
        </p>

        <Card className="mt-6 p-5 sm:p-6">
          {!isConfigured ? (
            <Alert tone="error" title="Store Portal is not configured">
              Supabase credentials are missing. Set VITE_SUPABASE_URL and
              VITE_SUPABASE_ANON_KEY in apps/store/.env.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              {formError ? <Alert tone="error">{formError}</Alert> : null}

              <Field label="Your full name" required error={errors.fullName?.message}>
                {(field) => (
                  <TextInput
                    {...field}
                    {...register("fullName")}
                    invalid={Boolean(errors.fullName)}
                    autoComplete="name"
                    placeholder="Enter your full name"
                  />
                )}
              </Field>

              <Field label="Email address" required error={errors.email?.message}>
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

              <Field label="Your phone" required error={errors.phone?.message}>
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

              <Field
                label="Password"
                required
                hint="At least 8 characters, including a letter and a number."
                error={errors.password?.message}
              >
                {(field) => (
                  <TextInput
                    {...field}
                    {...register("password")}
                    invalid={Boolean(errors.password)}
                    type="password"
                    autoComplete="new-password"
                  />
                )}
              </Field>

              <Field label="Confirm password" required error={errors.confirmPassword?.message}>
                {(field) => (
                  <TextInput
                    {...field}
                    {...register("confirmPassword")}
                    invalid={Boolean(errors.confirmPassword)}
                    type="password"
                    autoComplete="new-password"
                  />
                )}
              </Field>

              <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create account"}
                {!isSubmitting ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-5 text-center text-meta text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" className="inline-block py-1.5 font-semibold text-primary underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </Container>
  );
}
