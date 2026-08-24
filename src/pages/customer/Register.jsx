import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Container from "../../components/common/Container.jsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import Field, { TextInput } from "../../components/common/Field.jsx";
import PasswordInput from "../../components/common/PasswordInput.jsx";
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
      <div className="mx-auto max-w-lg">
        <h1 className="text-heading text-ink">Create account</h1>
        <p className="mt-2 text-body text-ink-muted">
          Keep browsing public. Sign in only when you want saved addresses and profile details.
        </p>

        <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-subtle sm:p-6">
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
      </div>
    </Container>
  );
}
