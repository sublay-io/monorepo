import { useCallback, useState } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import type { File as SublayFile } from "../../interfaces/models/File";
import { SublayError } from "../../errors/SublayError";

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

/** What `uploadFile` takes. */
export interface UploadFileProps {
  file: UniversalFile;
  /** The folder (sent as `file.options`); without it the file goes in `files`. */
  pathParts?: string[];
  /** Stored on the file. */
  metadata?: Record<string, any>;
  /** Called with the upload's progress, 0–100. */
  onProgress?: (progress: number) => void;
}

export interface UseUploadFileValues {
  uploadFile: (props: UploadFileProps) => Promise<SublayFile>;
  uploading: boolean;
  /** The current upload's progress, 0–100 (`0` when none is running). */
  progress: number;
}

/**
 * Uploads a file stored as uploaded (`POST /storage`). Resolves with the File.
 */
function useUploadFile(): UseUploadFileValues {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(
    async ({
      file,
      pathParts,
      metadata,
      onProgress,
    }: UploadFileProps): Promise<SublayFile> => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!file) {
        throw new SublayError("No file provided.");
      }
      if (pathParts !== undefined && !Array.isArray(pathParts)) {
        throw new SublayError("Invalid arguments. pathParts must be an array.");
      }

      setUploading(true);
      setProgress(0);

      try {
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
        if (metadata) {
          formData.append("metadata", JSON.stringify(metadata));
        }

        // Make the request with progress tracking
        const response = await axios.post(`/${projectId}/storage`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setProgress(percentCompleted);
              onProgress?.(percentCompleted);
            }
          },
        });

        return response.data as SublayFile;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [projectId, axios]
  );

  return { uploadFile, uploading, progress };
}

export default useUploadFile;
