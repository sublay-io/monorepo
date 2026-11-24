import type { ImageOptions } from "../interfaces/ImageProcessing";

/**
 * Helpers for building `multipart/form-data` request bodies. Shared by every
 * upload site (storage, chat messages, user avatar/banner) so they encode
 * fields identically: object/array values are JSON-stringified (the server
 * re-parses them), a `Date` goes as its ISO string, scalars are coerced to
 * strings, and `undefined` is skipped.
 *
 * Do NOT set the request's `Content-Type` manually for these bodies — axios sets
 * it to `undefined` for a `FormData` instance so the browser writes the
 * multipart boundary itself.
 */

/**
 * Append a single field: skip `undefined`, send a `Date` as its ISO string,
 * JSON-stringify objects/arrays.
 */
export function appendField(form: FormData, key: string, value: unknown): void {
  if (value === undefined) return;
  form.append(
    key,
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value)
  );
}

/** Append every own field of `fields` via {@link appendField}. */
export function appendFields(
  form: FormData,
  fields: Record<string, unknown>
): void {
  for (const [key, value] of Object.entries(fields)) {
    appendField(form, key, value);
  }
}

/**
 * Append a file part under `field`. The multipart filename is, in order of
 * precedence: an explicit `filename`, the `File`'s own name, then `fallback`.
 */
export function appendFile(
  form: FormData,
  field: string,
  file: Blob | File,
  opts?: { filename?: string; fallback?: string }
): void {
  const name =
    opts?.filename ??
    (file instanceof File && file.name ? file.name : undefined) ??
    opts?.fallback ??
    "upload";
  form.append(field, file, name);
}

/**
 * On a create, a `null` field means the same as leaving it out, so a
 * multipart body (which can't carry `null`) simply leaves it out.
 */
export function withoutNulls<T extends Record<string, unknown>>(fields: T): T {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== null)
  ) as T;
}

/**
 * A multipart field can't carry `null` (it would arrive as the text "null"),
 * so a field cleared with `null` can't travel with a file. Throws before
 * anything is sent; send the clear in a separate call without a file.
 */
export function refuseNullWithFile(
  fn: string,
  fields: Record<string, unknown>
): void {
  for (const [key, value] of Object.entries(fields)) {
    if (value === null) {
      throw new Error(
        `[Sublay] ${fn}: \`${key}: null\` can't be sent with a file. Clear it in a separate call without a file.`
      );
    }
  }
}

/**
 * A list of images (`images`): the files plus the processing options applied
 * to every one (`mode` is required).
 */
export interface ImageListUpload {
  files: (Blob | File)[];
  /** Image-processing config (must include `mode`) — see {@link ImageOptions}. */
  options: ImageOptions;
}

/**
 * A list of files stored as uploaded (`files`), with optional options
 * (`pathParts`, the folder they are stored under).
 */
export interface FileListUpload {
  files: (Blob | File)[];
  options?: {
    pathParts?: string[];
  };
}

/** The list uploads a request carries, or `undefined` for none. */
export interface ListUploads {
  images?: ImageListUpload;
  files?: FileListUpload;
}

/** Whether `lists` has any file to send (empty lists send nothing). */
export function hasListUploads(lists: ListUploads): boolean {
  return (
    (!!lists.images && lists.images.files.length > 0) ||
    (!!lists.files && lists.files.files.length > 0)
  );
}

/**
 * Appends a record's list uploads: images as `images` plus `images.options`,
 * raw files as `files` plus (when given) `files.options`, the options as JSON
 * strings. Empty lists are left out.
 */
export function appendListUploads(form: FormData, lists: ListUploads): void {
  const { images, files } = lists;
  if (images && images.files.length > 0) {
    images.files.forEach((file) =>
      appendFile(form, "images", file, { fallback: "image" })
    );
    appendField(form, "images.options", images.options);
  }
  if (files && files.files.length > 0) {
    files.files.forEach((file) =>
      appendFile(form, "files", file, { fallback: "file" })
    );
    appendField(form, "files.options", files.options);
  }
}
