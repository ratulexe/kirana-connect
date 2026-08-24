import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Container from "../../components/common/Container.jsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import Field, { TextInput } from "../../components/common/Field.jsx";
import { useAuth } from "../../auth/useAuth.js";
import { friendlyAuthMessage } from "../../auth/authMessages.js";
import { forgotPasswordSchema } from "../../features/customer/schemas.js";
import { zodResolver } from "../../lib/zodResolver.js";

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
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
      setMessage(`If ${email} has an account, a reset link is on its way.`);
    } catch (error) {
      setFormError(friendlyAuthMessage(error));
    }
  };

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-md">
        <h1 className="text-heading text-ink">Reset your password</h1>
        <p className="mt-2 text-body text-ink-muted">
          Enter your email and we will send a secure reset link.
        </p>

        <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-subtle sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
            {message ? <Alert tone="success">{message}</Alert> : null}
            {formError ? <Alert tone="error">{formError}</Alert> : null}
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
            <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-meta">
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
            Back to sign in
          </Link>
        </p>
      </div>
    </Container>
  );
}
