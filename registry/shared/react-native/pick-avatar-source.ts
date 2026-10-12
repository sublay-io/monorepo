// Which image to show as a user's avatar.
//
// The order is: the avatar file the user uploaded, then the `avatar` URL, then
// nothing (`null`), in which case the caller draws the generated avatar.
//
// An uploaded avatar is stored in several sizes ("variants"). Their names are
// chosen by the project at upload time, so a variant is picked by its
// dimensions, never by its name: the smallest one that is still sharp at the
// size the avatar is displayed at.
//
// This file has no imports, and it is the same on web and on React Native.
// Change it in both places or the two drift apart.

export interface AvatarFileVariant {
  publicPath?: string | null | undefined; // URL of this size
  width?: number | null | undefined;
  height?: number | null | undefined;
}

export interface AvatarFile {
  type?: string | null | undefined; // "image" for an avatar
  originalPath?: string | null | undefined; // URL of the original upload
  image?:
    | {
        variants?:
          | Record<string, AvatarFileVariant | null | undefined>
          | null
          | undefined;
        processingStatus?: string | null | undefined; // "completed" | "failed"
      }
    | null
    | undefined;
}

export interface AvatarSourceUser {
  avatar?: string | null | undefined; // URL of an avatar image
  avatarFile?: AvatarFile | null | undefined; // Avatar uploaded through Sublay
}

const usableUrl = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const positive = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

interface Candidate {
  name: string;
  url: string;
  side: number; // The smaller of width and height; 0 when unknown
  area: number;
}

// The variants that can be shown, in a stable order (by name)
const usableVariants = (file: AvatarFile): Candidate[] => {
  const image = file.image;
  if (!image || typeof image !== "object") return [];
  // A failed processing run leaves no variants worth trusting
  if (image.processingStatus === "failed") return [];

  const variants = image.variants;
  if (!variants || typeof variants !== "object") return [];

  const candidates: Candidate[] = [];
  for (const name of Object.keys(variants).sort()) {
    const variant = variants[name];
    if (!variant || typeof variant !== "object") continue;
    const url = usableUrl(variant.publicPath);
    if (!url) continue;
    const width = positive(variant.width);
    const height = positive(variant.height);
    candidates.push({
      name,
      url,
      side: Math.min(width, height),
      area: width * height,
    });
  }
  return candidates;
};

const pickFromFile = (file: AvatarFile, neededSize: number): string | null => {
  // Only an image can be shown as an avatar. A file without a type is taken
  // to be one.
  if (file.type != null && file.type !== "image") return null;

  const candidates = usableVariants(file);
  if (candidates.length === 0) return usableUrl(file.originalPath);

  let best = candidates[0];
  for (const candidate of candidates.slice(1)) {
    const bestFits = best.side >= neededSize;
    const candidateFits = candidate.side >= neededSize;

    if (candidateFits !== bestFits) {
      // One that is big enough always beats one that is not
      if (candidateFits) best = candidate;
    } else if (candidate.side !== best.side) {
      // Both big enough: the smaller one. Neither big enough: the larger one.
      if (candidateFits ? candidate.side < best.side : candidate.side > best.side)
        best = candidate;
    } else if (candidate.area !== best.area) {
      // Same smaller side: the lighter image when both are big enough,
      // the more detailed one otherwise
      if (candidateFits ? candidate.area < best.area : candidate.area > best.area)
        best = candidate;
    }
    // A full tie keeps the earlier name: candidates are sorted by name
  }
  return best.url;
};

/**
 * The URL of the image to show as the user's avatar, or `null` when the user
 * has none and the generated avatar should be drawn.
 *
 * @param user       The user (any object that may carry `avatarFile` / `avatar`)
 * @param size       The size the avatar is displayed at, in layout pixels
 * @param pixelRatio Device pixels per layout pixel (1 when unknown)
 */
export const pickAvatarSource = (
  user: AvatarSourceUser | null | undefined,
  size: number,
  pixelRatio: number
): string | null => {
  if (!user || typeof user !== "object") return null;

  const file = user.avatarFile;
  if (file && typeof file === "object") {
    const neededSize = positive(size) * (positive(pixelRatio) || 1);
    const fromFile = pickFromFile(file, neededSize);
    if (fromFile) return fromFile;
  }

  return usableUrl(user.avatar);
};
