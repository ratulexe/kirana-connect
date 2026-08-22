import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Container from "../components/Container.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import { useAuth } from "../auth/useAuth.js";
import { zodResolver } from "../lib/zodResolver.js";
import { loginSchema } from "../features/onboarding/schema.js";

/**
 * Supabase error strings are written for developers. These map the ones a store
 * owner can actually act on; anything else falls back to a neutral message
 * rather than leaking internals.
 */
function friendlyMessage(error) {
  const raw = String(error?.message ?? "").toLowerCase();
  if (raw.includes("invalid login credentials")) {
    return "That email and password combination does not match an account.";
  }
  if (raw.includes("email not confirmed")) {
    return "Please confirm your email address first. Check your inbox for the link we sent.";
  }
  if (raw.includes("rate limit") || raw.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Could not sign you in. Please try again.";
}

export default function Login() {
  const { signIn, isAuthenticated, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  if (isAuthenticated) return <Navigate to={location.state?.from ?? "/status"} replace />;

  const onSubmit = async (values) => {
    setFormError("");
    try {
      await signIn(values);
      navigate(location.state?.from ?? "/status", { replace: true });
    } catch (error) {
      setFormError(friendlyMessage(error));
    }
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-heading text-ink">Sign in</h1>
        <p className="mt-2 text-body text-ink-muted">
          Manage your Kirana Connect store listing.
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

              <Field label="Password" required error={errors.password?.message}>
                {(field) => (
                  <TextInput
                    {...field}
                    {...register("password")}
                    invalid={Boolean(errors.password)}
                    type="password"
                    autoComplete="current-password"
                  />
                )}
              </Field>

              <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-5 text-center text-meta text-ink-muted">
          Not listed yet?{" "}
          <Link to="/register" className="inline-block py-1.5 font-semibold text-primary underline underline-offset-2">
            Register your store
          </Link>
        </p>
      </div>
    </Container>
  );
}
