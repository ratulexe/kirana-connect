import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../auth/useAuth.js";
import { zodResolver } from "../lib/zodResolver.js";
import { forgotPasswordSchema } from "../features/admin/schemas.js";

function friendlyMessage(error) {
  const raw = String(error?.message ?? "").toLowerCase();
  if (raw.includes("rate limit") || raw.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Could not send the reset email. Please try again.";
}

export default function ForgotPassword() {
  const { requestPasswordReset, isConfigured } = useAuth();
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = async ({ email }) => {
    setMessage("");
    setFormError("");
    try {
      await requestPasswordReset(email);
      setMessage(`If ${email} has an admin account, a reset link is on its way.`);
    } catch (error) {
      setFormError(friendlyMessage(error));
    }
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#21165e] px-4 py-10">
      <div aria-hidden="true" className="absolute -left-24 -top-24 size-80 rounded-full bg-[#e93483]/60 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-20 -bottom-20 size-80 rounded-full bg-[#7358ee]/65 blur-3xl" />
      <div className="relative w-full max-w-md rounded-panel border border-white/20 bg-white/95 p-7 shadow-[0_28px_90px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-10">
        <Logo />
        <h1 className="mt-3 text-heading text-ink">Reset your password</h1>
        <p className="mt-2 text-body text-ink-muted">
          Enter your admin email and we will send a secure reset link.
        </p>

        <Card className="mt-6 p-5 sm:p-6">
          {!isConfigured ? (
            <Alert tone="error" title="Admin app is not configured">
              Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/admin/.env.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              {message ? <Alert tone="success">{message}</Alert> : null}
              {formError ? <Alert tone="error">{formError}</Alert> : null}

              <Field label="Email address" required error={errors.email?.message}>
                {(field) => (
                  <TextInput
                    {...field}
                    {...register("email")}
                    invalid={Boolean(errors.email)}
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                  />
                )}
              </Field>

              <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-5 text-center text-meta text-ink-muted">
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
