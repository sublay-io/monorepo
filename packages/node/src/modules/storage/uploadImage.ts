import { SublayHttpClient } from "../../core/client";
import { appendFile, appendFields } from "../../core/formData";
import { File } from "../../interfaces/File";
import { ImageOptions } from "../../interfaces/ImageProcessing";

export interface UploadImageProps {
  file: Uint8Array | Blob;
  filename?: string;
  mimeType?: string;
  /**
   * Image-processing configuration, a discriminated union on `mode` — see
   * {@link ImageOptions}. Sent as `file.options`, one JSON object.
   */
  imageOptions: ImageOptions;
  /** Stored on the file, with the server's `originalFilename`, `originalFormat` and `originalDimensions` alongside. */
  metadata?: Record<string, any>;
  /**
   * The user the service key acts as, who owns the upload. Omit for an
   * app-owned file.
   */
  actingUserId?: string;
}

/**
 * `POST /storage/images`: processes an image into its variants and stores
 * it. Resolves with the File, its `image` included.
 */
export async function uploadImage(
  client: SublayHttpClient,
  data: UploadImageProps
): Promise<File> {
  const { file, filename, mimeType, imageOptions, metadata, actingUserId } = data;

  const formData = new FormData();
  appendFile(formData, "file", file, filename, mimeType);
  // The processing options go as one JSON field, `file.options` (the folder
  // inside it), as an inline `<field>.options` does.
  appendFields(formData, {
    "file.options": imageOptions,
    metadata,
    actingUserId,
  });

  const response = await client.projectInstance.post<File>(
    "/storage/images",
    formData
  );
  return response.data;
}
