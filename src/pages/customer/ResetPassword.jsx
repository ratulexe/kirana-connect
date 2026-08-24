import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Container from "../../components/common/Container.jsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import Field from "../../components/common/Field.jsx";
import PasswordInput from "../../components/common/PasswordInput.jsx";
import { useAuth } from "../../auth/useAuth.js";
import { friendlyAuthMessage } from "../../auth/authMessages.js";
import { resetPasswordSchema } from "../../features/customer/schemas.js";
import { zodResolver } from "../../lib/zodResolver.js";

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
      window.setTimeout(() => navigate("/account", { replace: true }), 800);
    } catch (error) {
      setFormError(friendlyAuthMessage(error));
    }
  };

  const invalidLink = !auth.isLoading && !auth.isAuthenticated;

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-md">
        <h1 className="text-heading text-ink">Choose a new password</h1>
        <p className="mt-2 text-body text-ink-muted">
          Use at least 8 characters with a letter and a number.
        </p>

        <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-subtle sm:p-6">
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
            <Alert tone="success">Password updated. Taking you to your account.</Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
              {formError ? <Alert tone="error">{formError}</Alert> : null}

              <Field label="New password" required error={errors.password?.message}>
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
                {isSubmitting ? "Saving..." : "Save password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </Container>
  );
}
