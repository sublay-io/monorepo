// Image variant structure returned by the API
export interface FileImageVariant {
  publicPath: string;     // Proxy URL added by transformFileForResponse
  width: number;
  height: number;
  size: number;           // Bytes
  format: string;         // webp, jpeg, png
}

// Image extension data (populated for type: "image" files)
export interface FileImage {
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

  type: "image" | "video" | "document" | "other"; // From the MIME type
  originalPath: string;   // Proxied URL after transformFileForResponse
  originalSize: number;
  originalMimeType: string;
  position: number;

  metadata: Record<string, any>;
  // The image data: on an image uploaded as an image (an image slot, an
  // `images` list or `POST /storage/images`), `null` on any other file (a
  // `files` list or `POST /storage` stores the file as uploaded, so it has
  // none even when its `type` is "image"). Left out only where a response
  // doesn't load it.
  image?: FileImage | null;
  createdAt: string;
  updatedAt: string;
}
