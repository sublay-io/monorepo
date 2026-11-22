import { SublayHttpClient } from "../../core/client";
import { appendFile, appendFields } from "../../core/formData";
import { FileImageVariant } from "../../interfaces/File";
import { ImageOptions } from "../../interfaces/ImageProcessing";

/** One processed size of an uploaded image. */
export type UploadedImageVariant = FileImageVariant;

/** What `uploadImage` returns. */
export interface UploadImageResponse {
  fileId: string;
  type: "image";
  originalPath: string; // Proxy URL
  originalSize: number; // Bytes
  originalWidth: number;
  originalHeight: number;
  variants: Record<string, UploadedImageVariant>; // thumbnail, small, medium, large, etc.
  format: string;
  quality: number; // 1-100
  createdAt: string;
}

export interface UploadImageProps {
  file: Uint8Array | Blob;
  filename?: string;
  mimeType?: string;
  /**
   * Image-processing configuration. A discriminated union on `mode` mirroring
   * the server's `uploadImageBodySchema` — see {@link ImageOptions}.
   */
  imageOptions: ImageOptions;
  /** Storage path segments, e.g. ["uploads", "photos"]. */
  pathParts?: string[];
  /**
   * The user the service key acts as, who owns the upload. Omit for an
   * app-owned file.
   */
  actingUserId?: string;
}

export async function uploadImage(
  client: SublayHttpClient,
  data: UploadImageProps
): Promise<UploadImageResponse> {
  const { file, filename, mimeType, imageOptions, ...rest } = data;

  const formData = new FormData();
  appendFile(formData, "file", file, filename, mimeType);
  // The server reads the image-processing options as individual top-level
  // multipart fields (mode + mode-specific keys + quality/format/stripExif/fit),
  // not as a nested object — so flatten imageOptions alongside the other fields.
  appendFields(formData, { ...imageOptions, ...rest });

  const response = await client.projectInstance.post<UploadImageResponse>(
    "/storage/images",
    formData
  );
  return response.data;
}
