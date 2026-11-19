import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";

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
  position?: number;
  metadata?: Record<string, any>;
}

export interface UploadResponse {
  fileId: string;
  type: "image" | "video" | "document" | "other";
  relativePath: string;
  publicPath: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

function useUploadFile(): (file: UniversalFile, pathParts: string[], options?: UploadFileOptions) => Promise<UploadResponse> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const uploadFile = useCallback(
    async (
      file: UniversalFile,
      pathParts: string[],
      options?: UploadFileOptions
    ): Promise<UploadResponse> => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!file || !pathParts || !Array.isArray(pathParts)) {
        throw new Error("Invalid arguments. File and pathParts are required.");
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

      // Append pathParts
      formData.append("pathParts", JSON.stringify(pathParts));

      if (options?.position !== undefined) {
        formData.append("position", options.position.toString());
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

      return response.data as UploadResponse;
    },
    [projectId, axios]
  );

  return uploadFile;
}

export default useUploadFile;
