/**
 * Serializes an RTK Query `params` object into a query string, leaving out
 * every `null` and `undefined` value.
 *
 * On a filter, `null` and `undefined` both mean "not set", so the filter is
 * left out. `fetchBaseQuery`'s default serializer drops only `undefined` and
 * sends `null` as the string `"null"`, which the API refuses on its filters
 * (`parentSpaceId=null`, `sourceId=null`, ...). "Has none" is always the
 * caller's explicit `"none"`, which passes through like any other value.
 *
 * Mirrors axios, which the non-RTK hooks use and which also drops both.
 */
export function serializeQueryParams(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    search.append(key, String(value));
  }
  return search.toString();
}
