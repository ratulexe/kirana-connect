import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Container from "../../components/common/Container.jsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import Field, { TextInput } from "../../components/common/Field.jsx";
import PasswordInput from "../../components/common/PasswordInput.jsx";
import { MapPin, Sparkles, Zap } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { friendlyAuthMessage } from "../../auth/authMessages.js";
import { loginSchema } from "../../features/customer/schemas.js";
import { zodResolver } from "../../lib/zodResolver.js";

function readLinkError() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  if (!params.get("error") && !params.get("error_code")) return null;
  return friendlyAuthMessage({ message: params.get("error_description") ?? params.get("error_code") });
}

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState("");
  const [linkError] = useState(readLinkError);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  if (auth.isAuthenticated) return <Navigate to={location.state?.from ?? "/account"} replace />;

  const onSubmit = async (values) => {
    setFormError("");
    try {
      await auth.signIn(values);
      navigate(location.state?.from ?? "/account", { replace: true });
    } catch (error) {
      setFormError(friendlyAuthMessage(error));
    }
  };

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto grid max-w-4xl items-center gap-8 lg:grid-cols-[.85fr_1.15fr]">
        <div className="order-2 rounded-panel bg-[#21165e] p-7 text-white shadow-[0_20px_60px_rgba(37,23,102,.25)] lg:order-1">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#ffd45e] text-[#33216e]"><Sparkles className="size-5" /></span>
          <h2 className="mt-6 text-2xl font-bold tracking-tight">Your local favourites, one tap away.</h2>
          <p className="mt-3 text-body text-white/70">Keep your places close, search the shelf faster and make every market run feel easier.</p>
          <div className="mt-7 space-y-3 text-meta font-semibold text-white/85"><p className="flex items-center gap-2"><MapPin className="size-4 text-[#ffd45e]" /> Save your preferred location</p><p className="flex items-center gap-2"><Zap className="size-4 text-[#ffd45e]" /> Discover what is nearby</p></div>
        </div>
        <div className="order-1 lg:order-2">
        <h1 className="text-heading text-ink">Welcome back</h1>
        <p className="mt-2 text-body text-ink-muted">
          Save addresses and reuse your preferred location on Kirana Connect.
        </p>

        <div className="gloss-panel mt-6 rounded-panel p-5 sm:p-6">
          {!auth.isConfigured ? (
            <Alert tone="error" title="Consumer auth is not configured">
              Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the consumer environment.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
              {linkError ? <Alert tone="warning">{linkError}</Alert> : null}
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
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4 text-meta">
                <Link to="/forgot-password" className="font-semibold text-primary hover:text-primary-hover">
                  Forgot password
                </Link>
                <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
                  Create account
                </Link>
              </div>
            </form>
          )}
        </div>
        </div>
      </div>
    </Container>
  );
}
