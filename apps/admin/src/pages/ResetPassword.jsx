import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../auth/useAuth.js";
import { zodResolver } from "../lib/zodResolver.js";
import { resetPasswordSchema } from "../features/admin/schemas.js";

function friendlyMessage(error) {
  const raw = String(error?.message ?? "").toLowerCase();
  if (raw.includes("password") && (raw.includes("weak") || raw.includes("short"))) {
    return "Use a stronger password with at least 8 characters, including a letter and a number.";
  }
  return "Could not update your password. Please try again.";
}

export default function ResetPassword() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async ({ password }) => {
    setFormError("");
    try {
      await auth.updatePassword(password);
      setSuccess(true);
      window.setTimeout(() => navigate("/", { replace: true }), 800);
    } catch (error) {
      setFormError(friendlyMessage(error));
    }
  };

  const invalidLink = !auth.isLoading && !auth.isAuthenticated;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#21165e] px-4 py-10">
      <div aria-hidden="true" className="absolute -left-24 -top-24 size-80 rounded-full bg-[#e93483]/60 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-20 -bottom-20 size-80 rounded-full bg-[#7358ee]/65 blur-3xl" />
      <div className="relative w-full max-w-md rounded-panel border border-white/20 bg-white/95 p-7 shadow-[0_28px_90px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-10">
        <Logo />
        <h1 className="mt-3 text-heading text-ink">Choose a new password</h1>
        <p className="mt-2 text-body text-ink-muted">
          Use at least 8 characters with a letter and a number.
        </p>

        <Card className="mt-6 p-5 sm:p-6">
          {auth.isLoading ? (
            <Alert>Checking reset link...</Alert>
          ) : invalidLink ? (
            <Alert tone="error" title="Reset link not accepted">
              This reset link is invalid or expired.{" "}
              <Link to="/forgot-password" className="font-semibold text-primary">
                Request a new link
              </Link>
              .
            </Alert>
          ) : success ? (
            <Alert tone="success">Password updated. Taking you to the dashboard.</Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              {formError ? <Alert tone="error">{formError}</Alert> : null}

              <Field label="New password" required error={errors.password?.message}>
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

              <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save password"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
