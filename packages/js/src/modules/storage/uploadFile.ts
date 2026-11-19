import { SublayHttpClient } from "../../core/client";
import { appendFields, appendFile } from "../../core/multipart";

export interface UploadFileResponse {
  fileId: string;
  type: string;
  relativePath: string;
  publicPath: string;
  size: number;
  mimeType: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
}

export interface UploadFileProps {
  /** The file to upload, as a browser `File` or `Blob`. */
  file: Blob | File;
  /** Optional filename for the multipart part (defaults to the `File.name` or `"upload"`). */
  filename?: string;
  /**
   * Storage path segments for the file, e.g. ["avatars", userId]. Required by
   * the server (`uploadFileBodySchema.pathParts`).
   */
  pathParts: string[];
  /** Stored on the file as `position`. */
  position?: number;
  metadata?: Record<string, any>;
}

export async function uploadFile(
  client: SublayHttpClient,
  data: UploadFileProps
): Promise<UploadFileResponse> {
  const { file, filename, ...fields } = data;

  const formData = new FormData();
  // The server's multer config reads the file from the `file` field.
  appendFile(formData, "file", file, { filename });
  appendFields(formData, fields);

  const response = await client.projectInstance.post<UploadFileResponse>(
    "/storage",
    formData
  );
  return response.data;
}
