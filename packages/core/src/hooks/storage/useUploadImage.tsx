import { useCallback, useState } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { UploadImageOptions } from "../../interfaces/models/Image";
import type { File as SublayFile } from "../../interfaces/models/File";

// Type guard to detect browser File vs React Native file object
function isBrowserFile(file: UniversalFile): file is BrowserFile {
  return typeof File !== "undefined" && file instanceof File;
}

type BrowserFile = File;

interface RNFile {
  uri: string;
  name: string;
  type?: string;
}

type UniversalFile = BrowserFile | RNFile;

/**
 * What `uploadImage` takes: the image-processing options (sent as
 * `file.options`, one JSON object), plus the call's own `onProgress` and the
 * optional `metadata` stored on the file. Neither of those two goes inside
 * `file.options`.
 */
export type UseUploadImageOptions = UploadImageOptions & {
  onProgress?: (progress: number) => void; // Callback for upload progress
  metadata?: Record<string, any>;
};

export interface UseUploadImageValues {
  uploadImage: (file: UniversalFile, options: UseUploadImageOptions) => Promise<SublayFile>;
  uploading: boolean;
  progress: number;
}

function useUploadImage(): UseUploadImageValues {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = useCallback(
    async (
      file: UniversalFile,
      options: UseUploadImageOptions
    ): Promise<SublayFile> => {
      // Validate required inputs
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!file) {
        throw new Error("No file provided.");
      }

      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();

        // Append file (handle both browser and React Native)
        if (isBrowserFile(file)) {
          formData.append("file", file, file.name);
        } else {
          formData.append("file", {
            uri: file.uri,
            type: file.type || "image/jpeg",
            name: file.name,
          } as any);
        }

        // The processing options go as one JSON field, `file.options`
        // (`pathParts` inside); `metadata` goes as its own field.
        const { onProgress, metadata, ...imageOptions } = options;
        formData.append("file.options", JSON.stringify(imageOptions));
        if (metadata) {
          formData.append("metadata", JSON.stringify(metadata));
        }

        // Make request with progress tracking
        const response = await axios.post(
          `/${projectId}/storage/images`,
          formData,
          {
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
          }
        );

        return response.data as SublayFile;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [projectId, axios]
  );

  return {
    uploadImage,
    uploading,
    progress,
  };
}

export default useUploadImage;
