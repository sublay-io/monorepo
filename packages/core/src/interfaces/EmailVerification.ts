/**
 * How the confirmation email is sent when the project requires email
 * verification before sign-in. Accepted on sign-up and sign-in; ignored when
 * the setting is off.
 */
export interface EmailVerificationOptions {
  /**
   * `"link"` (default) emails a confirmation link; `"code"` emails a 6-digit
   * code that the app confirms with `useVerifyEmail` and the
   * `verificationId`.
   */
  mode?: "link" | "code";
  /**
   * Where the confirmation link sends the user after confirming. Must be on
   * the project's Verified Domains (400 `auth/redirect-url-not-allowed`
   * otherwise). Link mode only. `null` for none.
   */
  redirectUrl?: string | null;
}

/**
 * What a sign-up resolves with when the project requires email verification
 * before sign-in: no session is created, and the user signs in after
 * confirming their email.
 */
export interface EmailVerificationRequiredResult {
  emailVerificationRequired: true;
  /** Present in code mode. Pass it with the code to `useVerifyEmail`. */
  verificationId?: string;
}

/**
 * The rejection payload of the sign-up and sign-in thunks, and the fields
 * `useAuth` copies onto the `Error` it throws.
 */
export interface AuthRejection {
  /** The server's `error` text, else the transport's own message. */
  message: string;
  /** The server's error code, e.g. `auth/email-not-verified`. */
  code?: string;
  /**
   * The failing input, when the server names one: a dot path such as
   * `email`, or the field another user already holds on a
   * `auth/username-taken` / `auth/email-taken` 409.
   */
  param?: string;
  /**
   * Set on a sign-in refused with `auth/email-not-verified` in code mode: the
   * ID to confirm the freshly emailed code with.
   */
  verificationId?: string;
}

/** The `Error` `useAuth`'s sign-up and sign-in throw. */
export type SublayAuthError = Error & {
  code?: string;
  param?: string;
  verificationId?: string;
};
