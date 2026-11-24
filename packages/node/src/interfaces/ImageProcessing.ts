// Faithful mirror of the server's v8 image-processing options
// (`imageOptionsSchema`), the one JSON object every v8 image upload takes:
// `file.options` on `uploadImage`, and inline `<field>.options` on an image
// slot (`avatarFile`, `bannerFile`, `coverFile`) or an `images` list. The
// server validates it as a discriminated union on `mode`; the SDK exposes the
// same shapes so callers build valid options at compile time. Every requested
// size is 1–10000 px.

export type ImageFit = "cover" | "contain" | "inside" | "outside";
export type ImageFormat = "webp" | "jpeg" | "png" | "original";

interface BaseImageOptions {
  /** 1–100. Output quality. */
  quality?: number;
  format?: ImageFormat;
  stripExif?: boolean;
  /** 50–10000, default 3840. The longest side the stored original is shrunk to, in px. */
  originalMaxSize?: number;
  /** The folder the image is stored under. */
  pathParts?: string[];
}

/** Mode 1 — explicit width/height per named variant. */
export interface ExactDimensionsOptions extends BaseImageOptions {
  mode: "exact-dimensions";
  /** Keyed by variant name, e.g. `{ thumbnail: { width, height } }`. 1–10000. */
  dimensions: Record<string, { width: number; height: number }>;
  fit?: ImageFit;
}

/** Mode 2a — fixed aspect ratio, sized by width per variant. */
export interface AspectRatioWidthOptions extends BaseImageOptions {
  mode: "aspect-ratio-width-based";
  aspectRatio: { width: number; height: number };
  /** Keyed by variant name → target width (1–10000). */
  widths: Record<string, number>;
  fit?: ImageFit;
}

/** Mode 2b — fixed aspect ratio, sized by height per variant. */
export interface AspectRatioHeightOptions extends BaseImageOptions {
  mode: "aspect-ratio-height-based";
  aspectRatio: { width: number; height: number };
  /** Keyed by variant name → target height (1–10000). */
  heights: Record<string, number>;
  fit?: ImageFit;
}

/** Mode 3 — preserve the source aspect ratio, bounded per variant. */
export interface OriginalAspectOptions extends BaseImageOptions {
  mode: "original-aspect";
  /** Keyed by variant name → bounding size (1–10000). */
  sizes: Record<string, number>;
  /** Server restricts this mode to `inside` | `outside`. */
  fit?: "inside" | "outside";
}

/** Mode 4 — multiple aspect ratios, sized per variant. */
export interface MultiAspectRatioOptions extends BaseImageOptions {
  mode: "multi-aspect-ratio";
  /** 1–10 aspect ratios. */
  aspectRatios: { width: number; height: number }[];
  /** Keyed by variant name → target size (1–10000). */
  sizes: Record<string, number>;
  fit?: ImageFit;
}

export type ImageOptions =
  | ExactDimensionsOptions
  | AspectRatioWidthOptions
  | AspectRatioHeightOptions
  | OriginalAspectOptions
  | MultiAspectRatioOptions;
