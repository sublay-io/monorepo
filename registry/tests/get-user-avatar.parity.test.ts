import { describe, it, expect } from "vitest";
import { getUserAvatar as getWebUserAvatar } from "../shared/react/get-user-avatar";
import {
  getUserAvatar as getNativeUserAvatar,
  USER_AVATAR_VIEW_BOX_SIZE,
  type UserAvatarDescription,
  type UserAvatarShape,
} from "../shared/react-native/get-user-avatar";

/**
 * The React Native default avatar must be the same picture as the web one for
 * the same user id. Web builds an SVG string; React Native builds a
 * description that user-avatar.tsx draws with react-native-svg.
 *
 * The expected values here are read out of the web generator's real output
 * (its data URI, decoded and parsed), never recomputed, so this suite fails as
 * soon as either generator changes without the other.
 */

const DATA_URI_PREFIX = "data:image/svg+xml;base64,";

const attributes = (tag: string): Record<string, string> => {
  const found: Record<string, string> = {};
  for (const [, name, value] of tag.matchAll(/([\w-]+)="([^"]*)"/g)) {
    found[name] = value;
  }
  return found;
};

const number = (value: string | undefined): number => {
  if (value === undefined || value.trim() === "") {
    throw new Error("Missing numeric attribute in the web avatar SVG");
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Not a number in the web avatar SVG: ${value}`);
  }
  return parsed;
};

/** Decode the web avatar and read it back as a description. */
function describeWebAvatar(id: string): {
  description: UserAvatarDescription;
  viewBox: string | undefined;
  svg: string;
} {
  const dataUri = getWebUserAvatar(id);
  expect(dataUri.startsWith(DATA_URI_PREFIX)).toBe(true);
  const svg = atob(dataUri.slice(DATA_URI_PREFIX.length));

  const root = attributes(svg.match(/<svg\b[^>]*>/)![0]);
  expect(number(root.width)).toBe(USER_AVATAR_VIEW_BOX_SIZE);
  expect(number(root.height)).toBe(USER_AVATAR_VIEW_BOX_SIZE);

  // Everything drawn, in document order: the background, then one <g> a shape
  const drawn = [...svg.matchAll(/<rect\b[^>]*\/>|<g\b[^>]*>.*?<\/g>/gs)].map(
    (match) => match[0]
  );

  const background = attributes(drawn[0]);
  expect(drawn[0].startsWith("<rect")).toBe(true);
  expect(number(background.width)).toBe(USER_AVATAR_VIEW_BOX_SIZE);
  expect(number(background.height)).toBe(USER_AVATAR_VIEW_BOX_SIZE);

  const shapes = drawn.slice(1).map((group): UserAvatarShape => {
    const [, groupTag, inner] = group.match(/^(<g\b[^>]*>)(.*)<\/g>$/s)!;
    const fill = attributes(groupTag).fill;
    const elements = [...inner.matchAll(/<(\w+)\b[^>]*\/>/g)];
    expect(elements).toHaveLength(1);
    const [tag, name] = elements[0];
    const attrs = attributes(tag);
    const fillOpacity = number(attrs["fill-opacity"]);

    switch (name) {
      case "circle":
        expect(Object.keys(attrs).sort()).toEqual(
          ["cx", "cy", "fill-opacity", "r"].sort()
        );
        return {
          type: "circle",
          fill,
          fillOpacity,
          cx: number(attrs.cx),
          cy: number(attrs.cy),
          r: number(attrs.r),
        };
      case "rect":
        expect(Object.keys(attrs).sort()).toEqual(
          ["fill-opacity", "height", "rx", "width", "x", "y"].sort()
        );
        return {
          type: "rect",
          fill,
          fillOpacity,
          x: number(attrs.x),
          y: number(attrs.y),
          width: number(attrs.width),
          height: number(attrs.height),
          rx: number(attrs.rx),
        };
      case "polygon":
        expect(Object.keys(attrs).sort()).toEqual(["fill-opacity", "points"]);
        return {
          type: "polygon",
          fill,
          fillOpacity,
          points: attrs.points.split(" ").map((point) => {
            const [x, y, ...rest] = point.split(",");
            expect(rest).toHaveLength(0);
            return [number(x), number(y)];
          }),
        };
      default:
        throw new Error(`Unexpected element in the web avatar SVG: ${name}`);
    }
  });

  // Nothing in the SVG was left unread
  const leftover = svg
    .replace(/<svg\b[^>]*>/, "")
    .replace("</svg>", "")
    .replace(/<rect\b[^>]*\/>|<g\b[^>]*>.*?<\/g>/gs, "")
    .trim();
  expect(leftover).toBe("");

  return {
    description: { background: background.fill, shapes },
    viewBox: root.viewBox,
    svg,
  };
}

const UUID = "3f2b8c1e-9d4a-4e7b-a6c5-0f1e2d3c4b5a";

const ids: [label: string, id: string][] = [
  ["a short id", "a"],
  ["another short id", "u1"],
  ["a UUID", UUID],
  ["a UUID differing in its last character", UUID.slice(0, -1) + "b"],
  ["a UUID differing in its first character", "4" + UUID.slice(1)],
  ["a foreign-id style id", "user_12345"],
  ["a numeric id", "1234567890"],
  ["an id with non-ASCII characters", "üser-✓-名前"],
  ["a long id", "x".repeat(200)],
];

describe("React Native default avatar matches the web one", () => {
  it.each(ids)("%s", (_label, id) => {
    const web = describeWebAvatar(id);

    expect(web.viewBox).toBe(
      `0 0 ${USER_AVATAR_VIEW_BOX_SIZE} ${USER_AVATAR_VIEW_BOX_SIZE}`
    );
    // The web side really produced shapes, so equality below is not vacuous
    expect(web.description.shapes.length).toBeGreaterThanOrEqual(3);
    expect(web.description.shapes.length).toBeLessThanOrEqual(4);

    expect(getNativeUserAvatar(id)).toEqual(web.description);
  });

  it("an empty id is a plain gray square on both", () => {
    const web = describeWebAvatar("");

    expect(web.description).toEqual({ background: "#ddd", shapes: [] });
    expect(getNativeUserAvatar("")).toEqual(web.description);
  });

  it("a missing id is drawn like an empty one", () => {
    expect(getNativeUserAvatar(undefined)).toEqual(getNativeUserAvatar(""));
    expect(getNativeUserAvatar(null)).toEqual(getNativeUserAvatar(""));
  });

  it("covers every shape type and both shape counts", () => {
    const all = ids.map(([, id]) => getNativeUserAvatar(id));

    expect(new Set(all.map((avatar) => avatar.shapes.length))).toEqual(
      new Set([3, 4])
    );
    expect(
      new Set(all.flatMap((avatar) => avatar.shapes.map((shape) => shape.type)))
    ).toEqual(new Set(["circle", "rect", "polygon"]));
    // The diamond is the only four-cornered polygon
    expect(
      all.some((avatar) =>
        avatar.shapes.some(
          (shape) => shape.type === "polygon" && shape.points.length === 4
        )
      )
    ).toBe(true);
  });

  it("ids that differ by one character get different avatars", () => {
    expect(getNativeUserAvatar(UUID)).not.toEqual(
      getNativeUserAvatar(UUID.slice(0, -1) + "b")
    );
  });
});
