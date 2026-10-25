/** The space field a search term is matched against. */
export type SpaceSearchFields = "slug" | "name" | "description";

/**
 * Optional params for text-searching the space list.
 *
 * - `query` — free-text search term (trimmed; must not be blank). When
 *   omitted, no filtering is applied.
 * - `searchFields` — narrows which space field the term matches against. When
 *   omitted, the term matches `slug` OR `name` OR `description`
 *   (case-insensitive substring). `"slug"` / `"name"` / `"description"`
 *   restrict the match to that one field.
 */
export interface SpaceSearchParams {
  query?: string;
  searchFields?: SpaceSearchFields;
}
