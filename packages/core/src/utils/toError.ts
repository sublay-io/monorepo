/** A thrown value as an `Error`: an `Error` as it is, anything else wrapped. */
export const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err));
