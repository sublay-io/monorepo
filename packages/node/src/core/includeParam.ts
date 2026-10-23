/**
 * Puts an `include` value on the wire as one comma-separated string. An array
 * is joined; a single value passes through. Axios would otherwise serialize an
 * array as `include[]=…`, which the server does not read.
 */
export function serializeInclude(
  include: string | readonly string[] | undefined
): string | undefined {
  return Array.isArray(include) ? include.join(",") : (include as string | undefined);
}
