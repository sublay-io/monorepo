import { SublayHttpClient } from "../../core/client";

// Code mode + tokenFormat: "hex" — hex always produces a fixed 64-character
// string and ignores tokenLength entirely, so pairing it with a human-typed
// code produces something nobody can type. tokenLength is `?: never`, not just
// omitted — passing props through a variable (rather than an inline object
// literal) skips TypeScript's excess-property check, so plain omission alone
// doesn't stop `tokenLength` from sneaking through.
export interface SendCodeVerificationEmailHexProps {
  actingUserId: string;
  /** Defaults to `"code"`. */
  mode?: "code";
  tokenFormat: "hex";
  tokenLength?: never;
}

// Code mode + a short format — the code a user types.
export interface SendCodeVerificationEmailShortProps {
  actingUserId: string;
  /** Defaults to `"code"`. */
  mode?: "code";
  tokenFormat: "numeric" | "alpha" | "alphanumeric";
  /** Length of the code, 4–12. Defaults to 6. */
  tokenLength?: number;
}

// mode: "link" — the token is embedded in a URL, never read by a human, so
// format/length are just entropy choices with sensible server-side defaults.
export interface SendLinkVerificationEmailProps {
  actingUserId: string;
  mode: "link";
  tokenFormat?: "hex" | "numeric" | "alpha" | "alphanumeric";
  tokenLength?: number;
  /** Where to send the user after the link is verified; `null` for none. */
  redirectUrl?: string | null;
}

/**
 * `mode` defaults to `"code"`. In code mode `tokenFormat` is required and the
 * `tokenFormat`/`tokenLength` pair is a discriminated union rather than two
 * independent optionals, so a call can't silently fall back to the server's
 * default `tokenFormat: "hex"` and email a 64-character code no one could type.
 */
export type SendVerificationEmailProps =
  | SendCodeVerificationEmailHexProps
  | SendCodeVerificationEmailShortProps
  | SendLinkVerificationEmailProps;

export async function sendVerificationEmail(
  client: SublayHttpClient,
  data: SendVerificationEmailProps
): Promise<void> {
  await client.projectInstance.post<void>(
    "/auth/send-verification-email",
    data
  );
}
