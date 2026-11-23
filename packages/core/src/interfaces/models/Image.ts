// A processed variant of an uploaded image
export interface UploadedImageVariant {
  path: string;       // Relative storage path
  width: number;
  height: number;
  size: number;       // Bytes
  format: string;     // webp, jpeg, png
  publicPath: string; // Proxy URL for client access
}

// What an image upload returns
export interface UploadImageResponse {
  fileId: string;
  type: "image";
  originalPath: string;   // Proxy URL of the processed original
  originalSize: number;   // Bytes
  originalWidth: number;
  originalHeight: number;
  variants: Record<string, UploadedImageVariant>; // Keyed by variant name
  format: string;
  quality: number;
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
