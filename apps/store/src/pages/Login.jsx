import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Container from "../components/Container.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import { Sparkles, Store, Zap } from "lucide-react";
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

/**
 * Supabase reports failures from an email link in the URL fragment, e.g.
 * /login#error=access_denied&error_code=otp_expired. Reading it is the
 * difference between an explanation and an apparently blank login page.
 */
function readLinkError() {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const code = params.get("error_code");
  const error = params.get("error");
  if (!code && !error) return null;

  const expired = code === "otp_expired" || code === "email_link_invalid";

  return {
    expired,
    message: expired
      ? "That confirmation link has expired or was already used. Email links are single use, and some mail apps open them automatically. Send yourself a fresh one below."
      : (params.get("error_description")?.replace(/\+/g, " ") ??
        "That link could not be used. Please try signing in, or request a new confirmation email."),
  };
}

export default function Login() {
  const { signIn, resendConfirmation, isAuthenticated, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState("");
  // Read once during initialisation rather than in an effect: the hash is
  // already there on first render, so an effect would only cause a second one.
  const [linkError] = useState(readLinkError);
  const [resendState, setResendState] = useState({ status: "idle", message: "" });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  useEffect(() => {
    // Strip the fragment so a refresh does not resurrect a stale error.
    if (!linkError) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [linkError]);

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

  const handleResend = async () => {
    const email = getValues("email").trim();
    if (!email) {
      setResendState({ status: "error", message: "Enter your email address above first." });
      return;
    }

    setResendState({ status: "sending", message: "" });
    try {
      await resendConfirmation(email);
      setResendState({
        status: "sent",
        message: `A new confirmation link is on its way to ${email}. Open it promptly, as it expires.`,
      });
    } catch (error) {
      const raw = String(error?.message ?? "").toLowerCase();
      setResendState({
        status: "error",
        message:
          raw.includes("rate limit") || raw.includes("too many")
            ? "Too many emails requested. Wait a few minutes before trying again."
            : "Could not send the email. Check the address and try again.",
      });
    }
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto grid max-w-4xl items-center gap-8 lg:grid-cols-[.85fr_1.15fr]">
        <div className="order-2 rounded-panel bg-[#21165e] p-7 text-white shadow-[0_20px_60px_rgba(37,23,102,.25)] lg:order-1"><span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#ffd45e] text-[#33216e]"><Store className="size-5" /></span><h2 className="mt-6 text-2xl font-bold tracking-tight">Put your store on the local map.</h2><p className="mt-3 text-body text-white/70">Update your shelf, keep pricing clear, and turn nearby searches into real footsteps.</p><p className="mt-7 flex items-center gap-2 text-meta font-bold text-[#ffd45e]"><Zap className="size-4" /> Your shelf. Your signal.</p></div>
        <div className="order-1 lg:order-2"><p className="inline-flex items-center gap-2 text-meta font-bold tracking-[.13em] text-[#e93483] uppercase"><Sparkles className="size-3.5" /> Store studio</p><h1 className="mt-3 text-heading text-ink">Welcome back</h1>
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
              {linkError ? (
                <Alert tone="warning" title="Confirmation link not accepted">
                  {linkError.message}
                </Alert>
              ) : null}

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

              <div className="border-t border-line-soft pt-4">
                {resendState.status === "sent" ? (
                  <Alert tone="success">{resendState.message}</Alert>
                ) : resendState.status === "error" ? (
                  <Alert tone="error">{resendState.message}</Alert>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-meta text-ink-muted">
                    Confirmation link expired or missing?
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResend}
                    isLoading={resendState.status === "sending"}
                  >
                    {resendState.status === "sending" ? "Sending..." : "Resend email"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Card>

        <p className="mt-5 text-center text-meta text-ink-muted">
          Not listed yet?{" "}
          <Link
            to="/register"
            className="inline-block py-1.5 font-semibold text-primary underline underline-offset-2"
          >
            Register your store
          </Link>
        </p>
        </div></div>
    </Container>
  );
}
