/**
 * How the confirmation email is sent when the project requires email
 * verification before sign-in. Accepted on sign-up and sign-in; ignored when
 * the setting is off.
 */
export interface EmailVerificationOptions {
  /**
   * `"link"` (default) emails a confirmation link; `"code"` emails a 6-digit
   * code that the app confirms with `verifyEmail({ token, verificationId })`.
   */
  mode?: "link" | "code";
  /**
   * Where the confirmation link sends the user after confirming. Must be on
   * the project's Verified Domains (400 `auth/redirect-url-not-allowed`
   * otherwise). Link mode only.
   */
  redirectUrl?: string;
}

/**
 * Sign-up's `202` answer when the project requires email verification before
 * sign-in. No account details and no tokens: the same answer is returned
 * whether or not the email already has an account.
 */
export interface EmailVerificationRequiredResponse {
  success: true;
  emailVerificationRequired: true;
  /**
   * Present in code mode. Pass it with the code to `verifyEmail`.
   */
  verificationId?: string;
}

/**
 * The body of the `403 auth/email-not-verified` error sign-in returns when the
 * password is correct but the account's email isn't confirmed. A fresh
 * confirmation email has been sent. In code mode it carries the
 * `verificationId` to confirm the emailed code with.
 */
export interface EmailNotVerifiedErrorBody {
  error: string;
  code: "auth/email-not-verified";
  verificationId?: string;
}
