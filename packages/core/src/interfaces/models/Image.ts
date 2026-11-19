export interface ImageVariant {
  path: string;           // Relative storage path (e.g., "avatars/abc123/original.webp")
  publicPath: string;     // Proxy URL for client access
  width: number;          // Pixel width
  height: number;         // Pixel height
  size: number;           // File size in bytes
  format: string;         // Image format (webp, jpeg, png)
}

export interface Image {
  fileId: string;         // Primary file ID (links to File table)
  imageId: string;        // Same as fileId (backward compatibility)
  status: "completed" | "failed";
  original: ImageVariant; // Original processed image
  variants: Record<string, ImageVariant>; // Named variants (thumbnail, small, medium, large)
  metadata: {
    originalFormat: string;    // Format before processing
    originalSize: number;      // Size before processing (bytes)
    exifStripped: boolean;     // Whether EXIF data was removed
    processingTime: number;    // Sharp processing time (milliseconds)
  };
  createdAt: string;      // ISO 8601 timestamp
}

// Common properties across all modes
interface BaseImageOptions {
  quality?: number; // 1-100, default: 85
  format?: "webp" | "jpeg" | "png" | "original"; // default: "webp"
  stripExif?: boolean; // default: true
  pathParts?: string[]; // Storage path
  onProgress?: (progress: number) => void; // Callback for upload progress
}

// Mode 1: Exact Dimensions
export interface ExactDimensionsMode extends BaseImageOptions {
  mode: "exact-dimensions";
  dimensions: Record<string, { width: number; height: number }>;
  fit?: "cover" | "contain" | "inside" | "outside";
}

// Mode 2a: Aspect Ratio (Width-Based)
export interface AspectRatioWidthMode extends BaseImageOptions {
  mode: "aspect-ratio-width-based";
  aspectRatio: { width: number; height: number };
  widths: Record<string, number>;
  fit?: "cover" | "contain" | "inside" | "outside";
}

// Mode 2b: Aspect Ratio (Height-Based)
export interface AspectRatioHeightMode extends BaseImageOptions {
  mode: "aspect-ratio-height-based";
  aspectRatio: { width: number; height: number };
  heights: Record<string, number>;
  fit?: "cover" | "contain" | "inside" | "outside";
}

// Mode 3: Original Aspect Ratio
export interface OriginalAspectMode extends BaseImageOptions {
  mode: "original-aspect";
  sizes: Record<string, number>;
  fit?: "inside" | "outside";
}

// Mode 4: Multi Aspect Ratio
export interface MultiAspectRatioMode extends BaseImageOptions {
  mode: "multi-aspect-ratio";
  aspectRatios: Array<{ width: number; height: number }>;
  sizes: Record<string, number>;
  fit?: "cover" | "contain" | "inside" | "outside";
}

export type UploadImageOptions =
  | ExactDimensionsMode
  | AspectRatioWidthMode
  | AspectRatioHeightMode
  | OriginalAspectMode
  | MultiAspectRatioMode;
