import type { UploadImageOptions } from "../interfaces/models/Image";

/** A file picked in React Native / Expo: a local `uri` plus its name and type. */
export interface NativeUploadFile {
  uri: string;
  name: string;
  type?: string;
}

/** A file to upload: a browser `File` or `Blob`, or a React Native file. */
export type UploadFileInput = File | Blob | NativeUploadFile;

/**
 * One image for a single-image field (`avatarFile`, `bannerFile`): the file
 * plus the processing options the server needs (`mode` is required).
 */
export interface ImageSlotUpload {
  file: UploadFileInput;
  options: UploadImageOptions;
}

function isBlob(file: UploadFileInput): file is Blob {
  return typeof Blob !== "undefined" && file instanceof Blob;
}

/**
 * A list of images (`images`): the files plus the processing options the
 * server needs with them (`mode` is required), applied to every image.
 */
export interface ImageListUpload {
  files: UploadFileInput[];
  options: UploadImageOptions;
}

/**
 * A list of files stored as uploaded (`files`), with optional options
 * (`pathParts`, the folder they are stored under).
 */
export interface FileListUpload {
  files: UploadFileInput[];
  options?: {
    pathParts?: string[];
  };
}

/**
 * Appends a file under `field`, as the platform's FormData expects it. A
 * React Native file without a `type` goes as `nativeDefaultType`.
 */
export function appendUploadFile(
  formData: FormData,
  field: string,
  file: UploadFileInput,
  nativeDefaultType = "image/jpeg",
): void {
  if (isBlob(file)) {
    if (typeof File !== "undefined" && file instanceof File) {
      formData.append(field, file, file.name);
    } else {
      formData.append(field, file);
    }
    return;
  }
  // React Native's FormData takes `{ uri, name, type }` in place of a Blob.
  formData.append(field, {
    uri: file.uri,
    name: file.name,
    type: file.type || nativeDefaultType,
  } as any);
}

/** Appends a slot image as `<field>` plus its options as `<field>.options` (JSON). */
export function appendImageSlot(
  formData: FormData,
  field: string,
  upload: ImageSlotUpload,
): void {
  appendUploadFile(formData, field, upload.file);
  formData.append(`${field}.options`, JSON.stringify(upload.options));
}

/** Whether a list upload has files to send. */
export function hasListFiles(
  upload: ImageListUpload | FileListUpload | undefined,
): boolean {
  return !!upload && upload.files.length > 0;
}

/** Appends a list's images as `images` plus their options as `images.options` (JSON). */
export function appendImageList(
  formData: FormData,
  upload: ImageListUpload,
): void {
  for (const file of upload.files) appendUploadFile(formData, "images", file);
  formData.append("images.options", JSON.stringify(upload.options));
}

/**
 * Appends a list's raw files as `files` plus, when given, their options as
 * `files.options` (JSON).
 */
export function appendFileList(
  formData: FormData,
  upload: FileListUpload,
): void {
  for (const file of upload.files) {
    appendUploadFile(formData, "files", file, "application/octet-stream");
  }
  if (upload.options) {
    formData.append("files.options", JSON.stringify(upload.options));
  }
}

/**
 * On a create, a `null` field means the same as leaving it out, so a
 * multipart body (which can't carry `null`) simply leaves it out.
 */
export function withoutNulls<T extends Record<string, unknown>>(fields: T): T {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== null),
  ) as T;
}

/**
 * A multipart field can't carry `null` (it would arrive as the text "null"),
 * so a field cleared with `null` can't travel with a file. Throws before
 * anything is sent; send the clear in a separate call without a file.
 */
export function refuseNullWithFile(
  fn: string,
  fields: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(fields)) {
    if (value === null) {
      throw new Error(
        `[Sublay] ${fn}: \`${key}: null\` can't be sent with a file. Clear it in a separate call without a file.`,
      );
    }
  }
}
