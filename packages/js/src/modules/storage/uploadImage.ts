import { SublayHttpClient } from "../../core/client";
import { ImageOptions } from "../../interfaces/ImageProcessing";
import { File as SublayFile } from "../../interfaces/File";
import { appendFields, appendFile } from "../../core/multipart";

export interface UploadImageProps {
  /** The image to upload, as a browser `File` or `Blob`. */
  file: Blob | File;
  /** Optional filename for the multipart part (defaults to the `File.name` or `"upload"`). */
  filename?: string;
  /**
   * Image-processing configuration, a discriminated union on `mode` — see
   * {@link ImageOptions}. Sent as `file.options`, one JSON object.
   */
  imageOptions: ImageOptions;
  /**
   * The folder the image is stored under, e.g. ["uploads", "photos"]. Sent
   * inside `file.options`; when given, it takes the place of
   * `imageOptions.pathParts`.
   */
  pathParts?: string[];
  /** Stored on the file, with the server's `originalName` and `uploadedAt` alongside. */
  metadata?: Record<string, any>;
}

/**
 * `POST /storage/images`: processes an image into its variants and stores
 * it. Resolves with the File, its `image` included.
 */
export async function uploadImage(
  client: SublayHttpClient,
  data: UploadImageProps
): Promise<SublayFile> {
  const { file, filename, imageOptions, pathParts, metadata } = data;

  const formData = new FormData();
  // The server's multer config reads the file from the `file` field.
  appendFile(formData, "file", file, { filename });
  // The processing options go as one JSON field, `file.options` (the folder
  // inside it), as an inline `<field>.options` does.
  appendFields(formData, {
    "file.options":
      pathParts !== undefined ? { ...imageOptions, pathParts } : imageOptions,
    metadata,
  });

  const response = await client.projectInstance.post<SublayFile>(
    "/storage/images",
    formData
  );
  return response.data;
}
