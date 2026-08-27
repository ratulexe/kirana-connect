import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../auth/useAuth.js";
import { zodResolver } from "../lib/zodResolver.js";
import { loginSchema } from "../features/admin/schemas.js";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";

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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#21165e] px-4 py-10">
      <div aria-hidden="true" className="absolute -left-24 -top-24 size-80 rounded-full bg-[#e93483]/60 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-20 -bottom-20 size-80 rounded-full bg-[#7358ee]/65 blur-3xl" />
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-panel border border-white/20 bg-white/10 shadow-[0_28px_90px_rgba(0,0,0,.35)] backdrop-blur-xl lg:grid-cols-[.85fr_1.15fr]">
        <aside className="bg-gradient-to-br from-[#ff7e5d] to-[#e93483] p-7 text-white sm:p-10"><span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/20"><ShieldCheck className="size-6" /></span><h2 className="mt-8 text-3xl font-bold tracking-tight">Shape the local marketplace.</h2><p className="mt-3 text-body text-white/75">Review stores, curate products and keep the Kirana Connect network trustworthy.</p><p className="mt-10 flex items-center gap-2 text-meta font-bold"><Zap className="size-4 text-[#ffeb9a]" /> Operations, elevated.</p></aside>
        <div className="bg-white/95 p-7 sm:p-10">
        <div className="mb-6">
          <Logo />
          <h1 className="mt-3 text-heading text-ink">Admin sign in</h1>
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

              <Link
                to="/forgot-password"
                className="text-center text-meta font-semibold text-primary hover:text-primary-hover"
              >
                Forgot password
              </Link>
            </form>
          )}
        </Card>
        </div></div>
    </main>
  );
}
