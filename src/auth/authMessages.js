export function friendlyAuthMessage(error) {
  const raw = String(error?.message ?? "").toLowerCase();

  if (raw.includes("invalid login credentials")) {
    return "That email and password combination does not match an account.";
  }
  if (raw.includes("email not confirmed")) {
    return "Confirm this email address before signing in. Check your inbox for the link.";
  }
  if (raw.includes("already registered") || raw.includes("already exists") || raw.includes("user already")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (raw.includes("password") && (raw.includes("weak") || raw.includes("short"))) {
    return "Use a stronger password with at least 8 characters, including a letter and a number.";
  }
  if (raw.includes("rate limit") || raw.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (raw.includes("expired") || raw.includes("invalid")) {
    return "This link is invalid or expired. Request a fresh link and try again.";
  }
  if (raw.includes("network") || raw.includes("fetch")) {
    return "Could not reach Kirana Connect. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}
