import { SublayHttpClient } from "../../core/client";
import { appendFields, appendFile } from "../../core/multipart";
import { File as SublayFile } from "../../interfaces/File";

export interface UploadFileProps {
  /** The file to upload, as a browser `File` or `Blob`. */
  file: Blob | File;
  /** Optional filename for the multipart part (defaults to the `File.name` or `"upload"`). */
  filename?: string;
  /**
   * The folder the file is stored under, e.g. ["documents", "q1"] (sent as
   * `file.options`). Without it the file goes in `files`.
   */
  pathParts?: string[];
  /** Stored on the file, with the server's `originalFilename` alongside. */
  metadata?: Record<string, any>;
}

/**
 * `POST /storage`: stores a file as uploaded. Resolves with the File
 * (`image: null`).
 */
export async function uploadFile(
  client: SublayHttpClient,
  data: UploadFileProps
): Promise<SublayFile> {
  const { file, filename, pathParts, metadata } = data;

  const formData = new FormData();
  // The server's multer config reads the file from the `file` field.
  appendFile(formData, "file", file, { filename });
  appendFields(formData, {
    "file.options": pathParts !== undefined ? { pathParts } : undefined,
    metadata,
  });

  const response = await client.projectInstance.post<SublayFile>(
    "/storage",
    formData
  );
  return response.data;
}
