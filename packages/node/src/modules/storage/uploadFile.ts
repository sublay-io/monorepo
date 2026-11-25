import { SublayHttpClient } from "../../core/client";
import { appendFile, appendFields } from "../../core/formData";
import { File } from "../../interfaces/File";

export interface UploadFileProps {
  file: Uint8Array | Blob;
  filename?: string;
  mimeType?: string;
  /**
   * The folder the file is stored under, e.g. ["documents", "q1"] (sent as
   * `file.options`). Without it the file goes in `files`.
   */
  pathParts?: string[];
  /** Stored on the file, with the server's `originalFilename` alongside. */
  metadata?: Record<string, any>;
  /**
   * The user the service key acts as, who owns the upload. Omit for an
   * app-owned file.
   */
  actingUserId?: string;
}

/**
 * `POST /storage`: stores a file as uploaded. Resolves with the File
 * (`image: null`).
 */
export async function uploadFile(
  client: SublayHttpClient,
  data: UploadFileProps
): Promise<File> {
  const { file, filename, mimeType, pathParts, metadata, actingUserId } = data;

  const formData = new FormData();
  appendFile(formData, "file", file, filename, mimeType);
  appendFields(formData, {
    "file.options": pathParts !== undefined ? { pathParts } : undefined,
    metadata,
    actingUserId,
  });

  const response = await client.projectInstance.post<File>(
    "/storage",
    formData
  );
  return response.data;
}
