// Image variant structure returned by the API
export interface FileImageVariant {
  path: string;           // Relative storage path
  publicPath: string;     // Proxy URL added by transformFileForResponse
  width: number;
  height: number;
  size: number;           // Bytes
  format: string;         // webp, jpeg, png
}

// Image extension data (populated for type: "image" files)
export interface FileImage {
  fileId: string;
  originalWidth: number;
  originalHeight: number;
  variants: Record<string, FileImageVariant>;  // thumbnail, small, medium, large, etc.
  processingStatus: "completed" | "failed";
  processingError: string | null;
  format: string;         // User-requested format
  quality: number;        // User-requested quality (1-100)
  exifStripped: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface File {
  id: string;
  userId: string | null;
  entityId: string | null;
  eventId: string | null;
  commentId: string | null;
  chatMessageId: string | null;
  spaceId: string | null;

  type: "image" | "video" | "document" | "other";
  originalPath: string;   // Proxied URL after transformFileForResponse
  originalSize: number;
  originalMimeType: string;
  position: number;

  metadata: Record<string, any>;
  // The image data. On entity, event, space and user files: the data on an
  // image file, `null` on any other type. Not returned on chat-message and
  // conversation-avatar files.
  image?: FileImage | null;
  createdAt: string;
  updatedAt: string;
}
