import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Container from "../components/Container.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import { useAuth } from "../auth/useAuth.js";
import { zodResolver } from "../lib/zodResolver.js";
import { forgotPasswordSchema } from "../features/onboarding/schema.js";

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
      setMessage(`If ${email} has a store account, a reset link is on its way.`);
    } catch (error) {
      setFormError(friendlyMessage(error));
    }
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-heading text-ink">Reset your password</h1>
        <p className="mt-2 text-body text-ink-muted">
          Enter your email and we will send a secure reset link.
        </p>

        <Card className="mt-6 p-5 sm:p-6">
          {!isConfigured ? (
            <Alert tone="error" title="Store Portal is not configured">
              Supabase credentials are missing. Set VITE_SUPABASE_URL and
              VITE_SUPABASE_ANON_KEY in apps/store/.env.
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
                    placeholder="you@example.com"
                  />
                )}
              </Field>

              <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
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
    </Container>
  );
}
