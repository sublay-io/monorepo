/**
 * The `query` + `searchFields` pair as a list hook sends it. A blank or
 * whitespace-only `query` is left out (the server refuses an empty term with a
 * 400), and `searchFields` is left out whenever `query` is, since it only
 * narrows a term.
 */
export function buildSearchParams<F extends string>(
  query?: string | null,
  searchFields?: F | null
): { query?: string; searchFields?: F } {
  if (!query?.trim()) return {};
  return searchFields ? { query, searchFields } : { query };
}
