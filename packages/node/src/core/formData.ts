/**
 * Shared `multipart/form-data` helpers for upload-bearing requests (storage
 * uploads, chat attachments, avatar/banner images). Content-Type is always
 * left to axios so the multipart boundary is set correctly — never hand-set it.
 */
import type { ImageOptions } from "../interfaces/ImageProcessing";

/**
 * A file to upload. Raw bytes carry no name or type, so pass them: the server
 * accepts JPEG, PNG, WebP and PDF, and refuses a file whose `mimeType` isn't
 * one of them (a `Uint8Array` without one goes as
 * `application/octet-stream`). A `Blob` keeps its own type.
 */
export interface UploadFile {
  file: Uint8Array | Blob;
  filename?: string;
  mimeType?: string;
}

/**
 * One image for a single-image field (`avatarFile`, `bannerFile`): the file
 * plus the processing options the server requires with it (`mode` included).
 */
export interface ImageSlotFile extends UploadFile {
  options: ImageOptions;
}

/**
 * Wraps file bytes in a Blob so they can be appended to FormData. A Blob is
 * returned unchanged; a Uint8Array is wrapped with the given (or default) MIME type.
 */
export function toBlob(file: Uint8Array | Blob, mimeType?: string): Blob {
  // Cast needed because TypeScript's Blob constructor types are stricter than Node.js runtime allows
  return file instanceof Blob
    ? file
    : new Blob([file as unknown as BlobPart], {
        type: mimeType ?? "application/octet-stream",
      });
}

/** Appends file bytes under `field`, wrapping a Uint8Array in a Blob. */
export function appendFile(
  formData: FormData,
  field: string,
  file: Uint8Array | Blob,
  filename?: string,
  mimeType?: string
): void {
  formData.append(field, toBlob(file, mimeType), filename ?? "upload");
}

/**
 * Appends a slot image under `field` and its options as `<field>.options`
 * (a JSON string). Without a `filename`, the part is named `fallbackName`.
 */
export function appendImageSlot(
  formData: FormData,
  field: string,
  slot: ImageSlotFile,
  fallbackName: string
): void {
  appendFile(formData, field, slot.file, slot.filename ?? fallbackName, slot.mimeType);
  formData.append(`${field}.options`, JSON.stringify(slot.options));
}

/**
 * Appends scalar/object fields to FormData. Objects and arrays are
 * JSON-stringified (the server parses them back), a `Date` goes as its ISO
 * string; `undefined` values are skipped.
 */
export function appendFields(
  formData: FormData,
  fields: Record<string, unknown>
): void {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    formData.append(
      key,
      value instanceof Date
        ? value.toISOString()
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value)
    );
  }
}
