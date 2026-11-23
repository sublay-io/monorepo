/**
 * A date the server takes as an ISO 8601 datetime: a `Date` is sent as its
 * `toISOString()`, a string as it is.
 */
export function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}
