import { SublayHttpClient } from "../../core/client";
import { UploadedImageVariant } from "./uploadImage";

/** The image data `getFile` returns for an image file. */
export interface GetFileImage {
  originalWidth: number;
  originalHeight: number;
  variants: Record<string, UploadedImageVariant>; // thumbnail, small, medium, large, etc.
  processingStatus: "completed" | "failed";
  format: string;
  quality: number; // 1-100
  exifStripped: boolean;
}

/** What `getFile` returns: a flat view of the file, not the `File` record. */
export interface GetFileResponse {
  fileId: string;
  type: "image" | "video" | "document" | "other";
  originalPath: string; // Proxy URL
  originalSize: number; // Bytes
  originalMimeType: string;
  position: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Present only when set on the file.
  userId?: string;
  entityId?: string;
  commentId?: string;
  spaceId?: string;
  image?: GetFileImage; // Present only for image files
}

export interface GetFileProps {
  fileId: string;
}

export async function getFile(
  client: SublayHttpClient,
  data: GetFileProps
): Promise<GetFileResponse> {
  const { fileId } = data;
  const response = await client.projectInstance.get<GetFileResponse>(
    `/storage/${fileId}`
  );
  return response.data;
}
