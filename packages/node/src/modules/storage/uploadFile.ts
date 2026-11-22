import { SublayHttpClient } from "../../core/client";
import { appendFile, appendFields } from "../../core/formData";

/** What `uploadFile` returns. */
export interface UploadFileResponse {
  fileId: string;
  type: "image" | "video" | "document" | "other"; // From the file's MIME type
  relativePath: string; // Storage path
  publicPath: string; // Proxy URL
  size: number; // Bytes
  mimeType: string;
  createdAt: string;
}

export interface UploadFileProps {
  file: Uint8Array | Blob;
  filename?: string;
  mimeType?: string;
  /**
   * Storage path segments for the file, e.g. ["avatars", userId]. Required by
   * the server (`uploadFileBodySchema.pathParts`).
   */
  pathParts: string[];
  /** Stored on the file as `position`. */
  position?: number;
  metadata?: Record<string, any>;
  /**
   * The user the service key acts as, who owns the upload. Omit for an
   * app-owned file.
   */
  actingUserId?: string;
}

export async function uploadFile(
  client: SublayHttpClient,
  data: UploadFileProps
): Promise<UploadFileResponse> {
  const { file, filename, mimeType, ...fields } = data;

  const formData = new FormData();
  appendFile(formData, "file", file, filename, mimeType);
  appendFields(formData, fields);

  const response = await client.projectInstance.post<UploadFileResponse>(
    "/storage",
    formData
  );
  return response.data;
}
