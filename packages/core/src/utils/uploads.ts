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

/** Appends a file under `field`, as the platform's FormData expects it. */
export function appendUploadFile(
  formData: FormData,
  field: string,
  file: UploadFileInput,
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
    type: file.type || "image/jpeg",
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
