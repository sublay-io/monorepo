// The image-processing options of a v8 image upload: on `useUploadImage`
// (sent as `file.options`) and inline, as `<field>.options` on an image slot
// (`avatarFile`, `bannerFile`, `coverFile`) or an `images` list. One JSON
// object, a discriminated union on `mode`, mirroring the server's
// `imageOptionsSchema`. Every requested size is 1–10000 px, and `dimensions`,
// `widths`, `heights` and `sizes` take at most 30 entries (one variant each).

// Common properties across all modes
interface BaseImageOptions {
  quality?: number; // 1-100, default: 85
  // default: "webp". "original" keeps the upload's format when it is JPEG,
  // PNG or WebP, and stores anything else (an AVIF or HEIC, say) as WebP.
  format?: "webp" | "jpeg" | "png" | "original";
  stripExif?: boolean; // default: true
  /** The longest side the stored original is shrunk to, in px: 50–10000, default 3840. */
  originalMaxSize?: number;
  pathParts?: string[]; // The folder the image is stored under
}

// Mode 1: Exact Dimensions
export interface ExactDimensionsMode extends BaseImageOptions {
  mode: "exact-dimensions";
  dimensions: Record<string, { width: number; height: number }>; // 1-10000 each, at most 30 entries
  fit?: "cover" | "contain" | "inside" | "outside";
}

// Mode 2a: Aspect Ratio (Width-Based)
export interface AspectRatioWidthMode extends BaseImageOptions {
  mode: "aspect-ratio-width-based";
  aspectRatio: { width: number; height: number };
  widths: Record<string, number>; // 1-10000 each, at most 30 entries
  fit?: "cover" | "contain" | "inside" | "outside";
}

// Mode 2b: Aspect Ratio (Height-Based)
export interface AspectRatioHeightMode extends BaseImageOptions {
  mode: "aspect-ratio-height-based";
  aspectRatio: { width: number; height: number };
  heights: Record<string, number>; // 1-10000 each, at most 30 entries
  fit?: "cover" | "contain" | "inside" | "outside";
}

// Mode 3: Original Aspect Ratio
export interface OriginalAspectMode extends BaseImageOptions {
  mode: "original-aspect";
  sizes: Record<string, number>; // 1-10000 each, at most 30 entries
  fit?: "inside" | "outside";
}

// Mode 4: Multi Aspect Ratio
export interface MultiAspectRatioMode extends BaseImageOptions {
  mode: "multi-aspect-ratio";
  aspectRatios: Array<{ width: number; height: number }>; // 1-10
  sizes: Record<string, number>; // 1-10000 each, at most 30 entries
  fit?: "cover" | "contain" | "inside" | "outside";
}

export type UploadImageOptions =
  | ExactDimensionsMode
  | AspectRatioWidthMode
  | AspectRatioHeightMode
  | OriginalAspectMode
  | MultiAspectRatioMode;
