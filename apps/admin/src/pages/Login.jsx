import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../auth/useAuth.js";
import { zodResolver } from "../lib/zodResolver.js";
import { loginSchema } from "../features/admin/schemas.js";

function friendlyMessage(error) {
  const raw = String(error?.message ?? "").toLowerCase();
  if (raw.includes("invalid login credentials")) return "That email and password do not match.";
  if (raw.includes("email not confirmed")) return "Confirm this email address before signing in.";
  if (raw.includes("rate limit") || raw.includes("too many")) return "Too many attempts. Try again shortly.";
  return "Could not sign you in. Please try again.";
}

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  if (auth.isAuthenticated) return <Navigate to={location.state?.from ?? "/"} replace />;

  const onSubmit = async (values) => {
    setFormError("");
    try {
      await auth.signIn(values);
      navigate(location.state?.from ?? "/", { replace: true });
    } catch (error) {
      setFormError(friendlyMessage(error));
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Logo />
          <h1 className="mt-5 text-heading text-ink">Admin sign in</h1>
          <p className="mt-2 text-body text-ink-muted">
            Use a bootstrapped admin account. Public admin signup is disabled.
          </p>
        </div>

        <Card className="p-5 sm:p-6">
          {!auth.isConfigured ? (
            <Alert tone="error" title="Admin app is not configured">
              Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/admin/.env.
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
                    placeholder="admin@example.com"
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

              <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
