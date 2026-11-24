import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import type { File as SublayFile } from "../../interfaces/models/File";

// Type guard to detect if it's a real browser File
function isBrowserFile(file: UniversalFile): file is BrowserFile {
  return typeof File !== "undefined" && file instanceof File;
}

type BrowserFile = File;

export interface RNFile {
  uri: string;
  name: string;
  type?: string;
}

type UniversalFile = BrowserFile | RNFile;

export interface UploadFileOptions {
  metadata?: Record<string, any>; // Stored on the file
}

/**
 * Uploads a file stored as uploaded (`POST /storage`). `pathParts` is the
 * folder (sent as `file.options`); without it the file goes in `files`.
 * Resolves with the File.
 */
function useUploadFile(): (file: UniversalFile, pathParts?: string[], options?: UploadFileOptions) => Promise<SublayFile> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const uploadFile = useCallback(
    async (
      file: UniversalFile,
      pathParts?: string[],
      options?: UploadFileOptions
    ): Promise<SublayFile> => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!file) {
        throw new Error("No file provided.");
      }
      if (pathParts !== undefined && !Array.isArray(pathParts)) {
        throw new Error("Invalid arguments. pathParts must be an array.");
      }

      const formData = new FormData();

      // Append file (browser or React Native)
      if (isBrowserFile(file)) {
        formData.append("file", file, file.name);
      } else {
        formData.append("file", {
          uri: file.uri,
          type: file.type || "application/octet-stream",
          name: file.name,
        } as any);
      }

      // The folder goes inside `file.options`, one JSON field
      if (pathParts !== undefined) {
        formData.append("file.options", JSON.stringify({ pathParts }));
      }
      if (options?.metadata) {
        formData.append("metadata", JSON.stringify(options.metadata));
      }

      // Make the request
      const response = await axios.post(`/${projectId}/storage`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data as SublayFile;
    },
    [projectId, axios]
  );

  return uploadFile;
}

export default useUploadFile;
