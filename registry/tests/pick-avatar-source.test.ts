import { describe, it, expect } from "vitest";
import { pickAvatarSource as pickWeb } from "../shared/react/pick-avatar-source";
import { pickAvatarSource as pickNative } from "../shared/react-native/pick-avatar-source";

/**
 * The avatar shown for a user is, in order: the avatar file the user uploaded,
 * the `avatar` URL, then nothing (`null`, the caller draws a generated avatar).
 * For an uploaded file the variant is chosen by its dimensions, never by its
 * name: the smallest one whose smaller side covers `size x pixelRatio`.
 *
 * Web and React Native each carry their own copy of the helper. Every case
 * here runs against both and asserts they agree.
 */

const variant = (name: string, width: number, height = width) => ({
  path: `avatars/${name}.webp`,
  publicPath: `https://files.test/${name}.webp`,
  width,
  height,
  size: width * height,
  format: "webp",
});

const url = (name: string) => `https://files.test/${name}.webp`;

const ORIGINAL = "https://files.test/original.png";
const AVATAR = "https://cdn.test/avatar.png";

const imageFile = (
  variants: Record<string, unknown> | null | undefined,
  overrides: Record<string, unknown> = {},
  imageOverrides: Record<string, unknown> = {}
) => ({
  id: "file-1",
  type: "image",
  originalPath: ORIGINAL,
  image: { variants, processingStatus: "completed", ...imageOverrides },
  ...overrides,
});

// Names deliberately say nothing about size: only dimensions may be used.
// Declared out of size order so insertion order cannot pass for a size rule.
const squares = () =>
  imageFile({
    zebra: variant("s96", 96),
    alpha: variant("s400", 400),
    mango: variant("s48", 48),
    delta: variant("s200", 200),
  });

type Case = [
  label: string,
  user: unknown,
  size: number,
  pixelRatio: number,
  expected: string | null,
];

const cases: Case[] = [
  // --- No file ---
  ["no file and no avatar", { id: "u1" }, 32, 2, null],
  ["a missing user", undefined, 32, 2, null],
  ["a null user", null, 32, 2, null],
  ["avatar string only", { avatar: AVATAR }, 32, 2, AVATAR],
  ["an empty avatar string", { avatar: "" }, 32, 2, null],
  ["a whitespace avatar string", { avatar: "  \n\t " }, 32, 2, null],
  ["a non-string avatar", { avatar: 42 }, 32, 2, null],
  [
    "null fields",
    { avatar: null, avatarFile: null, avatarFileId: null },
    32,
    2,
    null,
  ],
  ["a null file next to an avatar string", { avatar: AVATAR, avatarFile: null }, 32, 2, AVATAR],

  // --- Several square variants (48, 96, 200, 400) ---
  // size 24: needs 24, 48, 72
  ["size 24 at 1x: smaller than all, smallest", { avatarFile: squares() }, 24, 1, url("s48")],
  ["size 24 at 2x: exact fit (48)", { avatarFile: squares() }, 24, 2, url("s48")],
  ["size 24 at 3x: in between (72 -> 96)", { avatarFile: squares() }, 24, 3, url("s96")],
  // size 96: needs 96, 192, 288
  ["size 96 at 1x: exact fit (96)", { avatarFile: squares() }, 96, 1, url("s96")],
  ["size 96 at 2x: in between (192 -> 200)", { avatarFile: squares() }, 96, 2, url("s200")],
  ["size 96 at 3x: in between (288 -> 400)", { avatarFile: squares() }, 96, 3, url("s400")],
  // Larger than every variant: the largest there is
  [
    "size 96 at 3x with only small variants: larger than all, largest",
    { avatarFile: imageFile({ b: variant("s48", 48), a: variant("s200", 200), c: variant("s96", 96) }) },
    96,
    3,
    url("s200"),
  ],
  [
    "size 24 at 3x with only small variants: larger than all, largest",
    { avatarFile: imageFile({ b: variant("s32", 32), a: variant("s16", 16), c: variant("s64", 64) }) },
    24,
    3,
    url("s64"),
  ],
  ["one pixel over a variant moves to the next one", { avatarFile: squares() }, 97, 1, url("s200")],
  ["a fractional pixel ratio", { avatarFile: squares() }, 24, 2.625, url("s96")],

  // --- Non-square variants: the smaller side decides ---
  [
    "non-square: a wide variant counts as its height",
    { avatarFile: imageFile({ a: variant("wide", 400, 60), b: variant("sq", 100, 100) }) },
    24,
    3, // needs 72: wide has only 60 on its smaller side
    url("sq"),
  ],
  [
    "non-square: a tall variant counts as its width",
    { avatarFile: imageFile({ a: variant("tall", 80, 300), b: variant("sq", 100, 100) }) },
    24,
    3, // needs 72: tall (80) is the smallest that fits
    url("tall"),
  ],
  [
    "non-square: none big enough, largest smaller side",
    { avatarFile: imageFile({ a: variant("wide", 1000, 50), b: variant("tall", 70, 90) }) },
    96,
    3,
    url("tall"),
  ],

  // --- Ties are broken the same way every time ---
  [
    "tie on the smaller side, both fit: the lighter image",
    { avatarFile: imageFile({ a: variant("big", 100, 300), b: variant("lean", 100, 100) }) },
    24,
    3,
    url("lean"),
  ],
  [
    "tie on the smaller side, none fit: the more detailed image",
    { avatarFile: imageFile({ b: variant("lean", 100, 100), a: variant("big", 100, 300) }) },
    96,
    3,
    url("big"),
  ],
  [
    "a full tie: the first name alphabetically",
    { avatarFile: imageFile({ zed: variant("z", 100), abe: variant("a", 100) }) },
    24,
    3,
    url("a"),
  ],

  // --- Unusable variants ---
  [
    "a variant missing publicPath is skipped",
    {
      avatarFile: imageFile({
        best: { width: 96, height: 96 }, // the right size, but nothing to load
        next: variant("s200", 200),
        small: variant("s48", 48),
      }),
    },
    24,
    3,
    url("s200"),
  ],
  [
    "an empty publicPath is skipped",
    {
      avatarFile: imageFile({
        best: { ...variant("s96", 96), publicPath: " " },
        next: variant("s200", 200),
      }),
    },
    24,
    3,
    url("s200"),
  ],
  [
    "every variant missing publicPath: the original",
    { avatarFile: imageFile({ a: { width: 96, height: 96 }, b: { width: 200, height: 200, publicPath: null } }) },
    24,
    3,
    ORIGINAL,
  ],
  [
    "a null variant is skipped",
    { avatarFile: imageFile({ a: null, b: variant("s200", 200) }) },
    24,
    3,
    url("s200"),
  ],
  [
    "a variant with missing dimensions is only a last resort",
    {
      avatarFile: imageFile({
        a: { publicPath: url("nodims") },
        b: variant("s16", 16),
      }),
    },
    96,
    3,
    url("s16"),
  ],
  [
    "a lone variant with missing dimensions is still shown",
    { avatarFile: imageFile({ a: { publicPath: url("nodims") } }) },
    24,
    2,
    url("nodims"),
  ],
  ["failed processing: the original", { avatarFile: imageFile(squares().image.variants, {}, { processingStatus: "failed" }) }, 24, 2, ORIGINAL],
  ["file with no variants (empty): the original", { avatarFile: imageFile({}) }, 24, 2, ORIGINAL],
  ["file with no variants (null): the original", { avatarFile: imageFile(null) }, 24, 2, ORIGINAL],
  ["file with no variants (missing): the original", { avatarFile: imageFile(undefined) }, 24, 2, ORIGINAL],
  ["file with no image data: the original", { avatarFile: { type: "image", originalPath: ORIGINAL } }, 24, 2, ORIGINAL],
  ["file with null image data: the original", { avatarFile: { type: "image", originalPath: ORIGINAL, image: null } }, 24, 2, ORIGINAL],

  // --- File and avatar string together ---
  ["file and avatar string: the file wins", { avatar: AVATAR, avatarFile: squares() }, 24, 2, url("s48")],
  [
    "file without variants and avatar string: the file's original wins",
    { avatar: AVATAR, avatarFile: imageFile({}) },
    24,
    2,
    ORIGINAL,
  ],
  [
    "a file with nothing to show falls back to the avatar string",
    { avatar: AVATAR, avatarFile: imageFile({}, { originalPath: "" }) },
    24,
    2,
    AVATAR,
  ],
  [
    "a file with nothing to show and no avatar string",
    { avatarFile: imageFile(null, { originalPath: null }) },
    24,
    2,
    null,
  ],
  [
    "a file that is not an image is not shown",
    { avatar: AVATAR, avatarFile: { type: "document", originalPath: ORIGINAL } },
    24,
    2,
    AVATAR,
  ],
  ["an empty file object", { avatarFile: {} }, 24, 2, null],
  ["a file that is not an object", { avatar: AVATAR, avatarFile: "file-1" }, 24, 2, AVATAR],

  // --- Missing numbers ---
  ["a missing size: the smallest variant", { avatarFile: squares() }, undefined as unknown as number, 2, url("s48")],
  ["a missing pixel ratio counts as 1", { avatarFile: squares() }, 96, undefined as unknown as number, url("s96")],
  ["a zero pixel ratio counts as 1", { avatarFile: squares() }, 96, 0, url("s96")],
  ["a NaN pixel ratio counts as 1", { avatarFile: squares() }, 96, NaN, url("s96")],
];

const implementations = [
  ["web", pickWeb],
  ["react native", pickNative],
] as const;

describe.each(implementations)("pickAvatarSource (%s)", (_platform, pick) => {
  it.each(cases)("%s", (_label, user, size, pixelRatio, expected) => {
    expect(pick(user as never, size, pixelRatio)).toBe(expected);
  });

  it("does not depend on the order the variants are listed in", () => {
    const entries = Object.entries(squares().image.variants!);
    const reversed = imageFile(Object.fromEntries([...entries].reverse()));
    for (const size of [24, 96]) {
      for (const ratio of [1, 2, 3]) {
        expect(pick({ avatarFile: reversed } as never, size, ratio)).toBe(
          pick({ avatarFile: squares() } as never, size, ratio)
        );
      }
    }
  });

  it("never throws on a malformed user", () => {
    const malformed: unknown[] = [
      0,
      "user",
      [],
      { avatarFile: [] },
      { avatarFile: { image: "x" } },
      { avatarFile: { image: { variants: "x" } } },
      { avatarFile: { image: { variants: [1, "a", null] } } },
      { avatarFile: { image: { variants: { a: 1, b: "x" } } } },
      { avatarFile: { image: { variants: { a: { publicPath: 5, width: "9" } } } } },
    ];
    for (const user of malformed) {
      expect(() => pick(user as never, 32, 2)).not.toThrow();
      expect(pick(user as never, 32, 2)).toBeNull();
    }
  });
});

describe("pickAvatarSource is the same on web and React Native", () => {
  it.each(cases)("%s", (_label, user, size, pixelRatio) => {
    expect(pickNative(user as never, size, pixelRatio)).toBe(
      pickWeb(user as never, size, pixelRatio)
    );
  });
});
