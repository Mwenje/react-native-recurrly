export type AuthField = "email" | "password" | "confirmPassword" | "code";

export type AuthFieldErrors = Partial<Record<AuthField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates that an email address is present and has a valid basic shape. */
export function validateEmail(email: string) {
  if (!email.trim()) return "Enter your email address.";
  if (!emailPattern.test(email.trim())) return "Enter a valid email address.";
  return "";
}

/** Validates that a password is present and meets the minimum length. */
export function validatePassword(password: string) {
  if (!password) return "Enter your password.";
  if (password.length < 8) return "Use at least 8 characters.";
  return "";
}

/** Validates that a password confirmation is present and matches. */
export function validateConfirmation(password: string, confirmation: string) {
  if (!confirmation) return "Confirm your password.";
  if (password !== confirmation) return "Passwords do not match.";
  return "";
}

/** Validates that an email verification code contains exactly six digits. */
export function validateCode(code: string) {
  if (!/^\d{6}$/.test(code.trim())) return "Enter the 6-digit code.";
  return "";
}

/** Extracts a user-facing message from an unknown Clerk error value. */
export function getClerkErrorMessage(
  source: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (!source || typeof source !== "object") return fallback;

  const error = source as {
    longMessage?: unknown;
    message?: unknown;
    errors?: Array<{ longMessage?: unknown; message?: unknown }>;
  };

  const firstError = error.errors?.[0];
  const message =
    firstError?.longMessage ??
    firstError?.message ??
    error.longMessage ??
    error.message;

  return typeof message === "string" && message.trim() ? message : fallback;
}
