import { useCallback, useState } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Image, UploadImageOptions } from "../../interfaces/models/Image";

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

export interface UseUploadImageValues {
  uploadImage: (file: UniversalFile, options: UploadImageOptions) => Promise<Image>;
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
      options: UploadImageOptions
    ): Promise<Image> => {
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

        // Append mode (required)
        formData.append("mode", options.mode);

        // Append mode-specific fields
        if (options.mode === "exact-dimensions") {
          formData.append("dimensions", JSON.stringify(options.dimensions));
        } else if (options.mode === "aspect-ratio-width-based") {
          formData.append("aspectRatio", JSON.stringify(options.aspectRatio));
          formData.append("widths", JSON.stringify(options.widths));
        } else if (options.mode === "aspect-ratio-height-based") {
          formData.append("aspectRatio", JSON.stringify(options.aspectRatio));
          formData.append("heights", JSON.stringify(options.heights));
        } else if (options.mode === "original-aspect") {
          formData.append("sizes", JSON.stringify(options.sizes));
        }

        // Append common optional fields
        if (options.pathParts) {
          formData.append("pathParts", JSON.stringify(options.pathParts));
        }

        if (options.quality !== undefined) {
          formData.append("quality", options.quality.toString());
        }

        if (options.format) {
          formData.append("format", options.format);
        }

        if (options.stripExif !== undefined) {
          formData.append("stripExif", options.stripExif.toString());
        }

        if (options.fit) {
          formData.append("fit", options.fit);
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
                options.onProgress?.(percentCompleted);
              }
            },
          }
        );

        return response.data as Image;
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
