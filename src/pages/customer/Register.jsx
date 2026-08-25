import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Container from "../../components/common/Container.jsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import Field, { TextInput } from "../../components/common/Field.jsx";
import PasswordInput from "../../components/common/PasswordInput.jsx";
import { Heart, MapPin, Sparkles } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { friendlyAuthMessage } from "../../auth/authMessages.js";
import { registerSchema } from "../../features/customer/schemas.js";
import { zodResolver } from "../../lib/zodResolver.js";

export default function Register() {
  const auth = useAuth();
  const navigate = useNavigate();
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

  if (auth.isAuthenticated) return <Navigate to="/account" replace />;

  const onSubmit = async (values) => {
    setFormError("");
    setConfirmationEmail("");
    try {
      const result = await auth.signUp(values);
      if (result.needsEmailConfirmation) {
        setConfirmationEmail(values.email);
      } else {
        navigate("/account", { replace: true });
      }
    } catch (error) {
      setFormError(friendlyAuthMessage(error));
    }
  };

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <aside className="relative order-2 overflow-hidden rounded-panel bg-gradient-to-br from-[#ef4d7b] via-[#e93483] to-[#794ee0] p-7 text-white shadow-[0_22px_60px_rgba(155,39,117,.25)] lg:sticky lg:top-24 lg:order-1"><span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/18"><Sparkles className="size-5" /></span><h2 className="mt-6 text-2xl font-bold tracking-tight">Make local shopping yours.</h2><p className="mt-3 text-body text-white/75">Save places you love and make every little shopping run easier to start.</p><div className="mt-8 space-y-3 text-meta font-bold"><p className="flex items-center gap-2"><MapPin className="size-4 text-[#ffec9d]" /> Keep favourite locations close</p><p className="flex items-center gap-2"><Heart className="size-4 text-[#ffec9d]" /> Support local, your way</p></div><span aria-hidden="true" className="absolute -right-10 -bottom-12 size-36 rounded-full border-[18px] border-white/12" /></aside>
        <div className="order-1 lg:order-2"><p className="inline-flex items-center gap-2 text-meta font-bold tracking-[.13em] text-[#e93483] uppercase"><Sparkles className="size-3.5" /> Join the neighbourhood</p><h1 className="mt-3 text-heading text-ink">Create account</h1>
        <p className="mt-2 text-body text-ink-muted">
          Keep browsing public. Sign in only when you want saved addresses and profile details.
        </p>

        <div className="gloss-panel mt-6 rounded-panel p-5 sm:p-6">
          {confirmationEmail ? (
            <Alert tone="success" title="Check your email">
              We sent a confirmation link to {confirmationEmail}. After confirming, sign in to use saved addresses.
            </Alert>
          ) : (
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
          )}
        </div>

        <p className="mt-5 text-center text-meta text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
        </div></div>
    </Container>
  );
}
