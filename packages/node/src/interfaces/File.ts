// Image variant structure returned by the API
export interface FileImageVariant {
  publicPath: string;     // A signed link; stops working at the File's `linksExpireAt`
  width: number;
  height: number;
  size: number;       // Bytes
  format: string;     // webp, jpeg, png
}

// Image extension data (populated for type: "image" files)
export interface FileImage {
  originalWidth: number;
  originalHeight: number;
  variants: Record<string, FileImageVariant>; // thumbnail, small, medium, large, etc.
  processingStatus: "completed" | "failed";
  processingError: string | null;
  format: string;     // The stored file's format (webp, jpeg, png)
  quality: number;    // Requested quality (1-100)
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
  originalPath: string;   // A signed link; stops working at `linksExpireAt`
  originalSize: number;
  originalMimeType: string; // The stored file's type: for a processed image, image/<format>
  position: number;
  metadata: Record<string, any>;
  // The image data: on an image uploaded as an image (an image slot, an
  // `images` list or `POST /storage/images`), `null` on any other file (a
  // `files` list or `POST /storage` stores the file as uploaded, so it has
  // none even when its `type` is "image"). The same on every File v8 returns.
  image?: FileImage | null;
  // When every link on this File (`originalPath` and each variant's
  // `publicPath`) stops working, as an ISO timestamp: 24–48 h after it was
  // read. Get fresh links by reading the record again, or from
  // `POST /files/links` by the File's `id`. Store the id, never a link.
  // Missing only on a File whose links don't expire.
  linksExpireAt?: string;
  createdAt: string;
  updatedAt: string;
}
