// The default avatar for a user who has no avatar image: a coloured
// background and a few geometric shapes, all derived from the user's id, so
// the same user always gets the same picture.
//
// This file has no React Native import: it only works out WHAT to draw.
// `user-avatar.tsx` draws it with react-native-svg. The hashing, the seeded
// random values, the palettes and the shape maths are the same as in the web
// component's `get-user-avatar.ts`, so a user gets the same default avatar on
// web and on React Native. Change them in both places or the two drift apart.

// The avatar is described in a 100 x 100 coordinate space (the SVG viewBox)
export const USER_AVATAR_VIEW_BOX_SIZE = 100;

// Background for a missing or empty id
const EMPTY_AVATAR_BACKGROUND = "#ddd";

export type UserAvatarShape =
  | {
      type: "circle";
      fill: string;
      fillOpacity: number;
      cx: number;
      cy: number;
      r: number;
    }
  | {
      type: "rect";
      fill: string;
      fillOpacity: number;
      x: number;
      y: number;
      width: number;
      height: number;
      rx: number;
    }
  | {
      type: "polygon";
      fill: string;
      fillOpacity: number;
      points: [number, number][]; // [x, y] corners, in drawing order
    };

export interface UserAvatarDescription {
  background: string;
  shapes: UserAvatarShape[]; // drawn in order, later shapes on top
}

// Improved hash function for better distribution across color palettes
const hashCode = (str: string) => {
  let hash = 0;
  if (str.length === 0) return hash;

  // Use a larger prime number for better distribution
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Additional mixing to spread similar strings apart
  hash = hash ^ (hash >>> 16);
  hash = hash * 0x85ebca6b;
  hash = hash ^ (hash >>> 13);
  hash = hash * 0xc2b2ae35;
  hash = hash ^ (hash >>> 16);

  return Math.abs(hash);
};

// Generate deterministic "random" values from seed
const seededRandom = (seed: string, index = 0) => {
  const value = hashCode(seed + index);
  return (value % 1000) / 1000; // Return value between 0 and 1
};

// 12 diverse color palettes covering the full spectrum for maximum distinction
const colorPalettes = [
  // Red family
  { bg: "#e74c3c", shapes: ["#f39c12", "#2ecc71", "#ecf0f1"] },
  // Orange family
  { bg: "#f39c12", shapes: ["#e74c3c", "#27ae60", "#34495e"] },
  // Yellow family
  { bg: "#f1c40f", shapes: ["#8e44ad", "#16a085", "#2c3e50"] },
  // Green family
  { bg: "#27ae60", shapes: ["#3498db", "#e74c3c", "#ecf0f1"] },
  // Teal family
  { bg: "#16a085", shapes: ["#f39c12", "#9b59b6", "#34495e"] },
  // Blue family
  { bg: "#3498db", shapes: ["#e67e22", "#27ae60", "#2c3e50"] },
  // Purple family
  { bg: "#9b59b6", shapes: ["#f1c40f", "#16a085", "#ecf0f1"] },
  // Pink family
  { bg: "#e91e63", shapes: ["#00bcd4", "#4caf50", "#424242"] },
  // Brown family
  { bg: "#8d6e63", shapes: ["#ff9800", "#009688", "#f5f5f5"] },
  // Gray family
  { bg: "#607d8b", shapes: ["#ff5722", "#8bc34a", "#ffffff"] },
  // Bright neon family
  { bg: "#00e676", shapes: ["#ff1744", "#2979ff", "#37474f"] },
  // Dark rich family
  { bg: "#263238", shapes: ["#ff6f00", "#e91e63", "#00acc1"] },
];

// Generate geometric patterns
const generatePattern = (
  seed: string,
  type: number,
  fill: string
): UserAvatarShape | null => {
  const r1 = seededRandom(seed, type * 10);
  const r2 = seededRandom(seed, type * 10 + 1);
  const r3 = seededRandom(seed, type * 10 + 2);

  const size = 30 + r1 * 40; // Size between 30-70
  const x = r2 * 80; // Position 0-80 (leaving margin)
  const y = r3 * 80; // Position 0-80 (leaving margin)

  switch (type % 4) {
    case 0: // Circle
      return {
        type: "circle",
        fill,
        fillOpacity: 0.8,
        cx: x + 20,
        cy: y + 20,
        r: size / 2,
      };
    case 1: // Rectangle
      return {
        type: "rect",
        fill,
        fillOpacity: 0.7,
        x: x + 10,
        y: y + 10,
        width: size,
        height: size * 0.6,
        rx: 5,
      };
    case 2: // Triangle
      return {
        type: "polygon",
        fill,
        fillOpacity: 0.6,
        points: [
          [x + 20, y + 10],
          [x + 20 + size / 2, y + 10 + size],
          [x + 20 - size / 2, y + 10 + size],
        ],
      };
    case 3: // Diamond
      return {
        type: "polygon",
        fill,
        fillOpacity: 0.7,
        points: [
          [x + 20, y],
          [x + 20 + size / 2, y + 20],
          [x + 20, y + 40],
          [x + 20 - size / 2, y + 20],
        ],
      };
    default:
      return null;
  }
};

export const getUserAvatar = (
  id: string | null | undefined
): UserAvatarDescription => {
  // No id: a plain gray square
  if (!id) return { background: EMPTY_AVATAR_BACKGROUND, shapes: [] };

  // Select color palette with maximum distribution
  // Use string length and multiple character properties for unique distribution
  const stringLength = id.length;
  const firstChar = id.charCodeAt(0) || 0;
  const lastChar = id.charCodeAt(id.length - 1) || 0;
  const middleChar = id.charCodeAt(Math.floor(id.length / 2)) || 0;

  // Combine multiple string properties for unique mapping
  const distributionValue =
    hashCode(id) +
    stringLength * 47 +
    firstChar * 73 +
    lastChar * 101 +
    middleChar * 137;

  const paletteIndex = Math.abs(distributionValue) % colorPalettes.length;
  const palette = colorPalettes[paletteIndex];

  // Generate 3-4 geometric shapes with different colors
  const numShapes = 3 + (hashCode(id + "count") % 2); // 3 or 4 shapes
  const shapes: UserAvatarShape[] = [];

  for (let i = 0; i < numShapes; i++) {
    const colorIndex = hashCode(id + "color" + i) % palette.shapes.length;
    const shapeColor = palette.shapes[colorIndex];
    const pattern = generatePattern(id + "shape" + i, i, shapeColor);

    if (pattern) {
      shapes.push(pattern);
    }
  }

  return { background: palette.bg, shapes };
};
