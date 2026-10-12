export type UITheme = "light" | "dark";

/**
 * The colors the presentational components draw with, per theme. Light is the
 * default, so a component rendered without a `theme` looks as it always has.
 */
export const uiColors = {
  light: {
    surface: "#ffffff",
    control: "#e5e7eb",
    muted: "#888888",
    text: "inherit",
    divider: "#e6e6e6",
    skeleton: "#efefef",
    mention: "#1e40af",
  },
  dark: {
    surface: "#262626",
    control: "#404040",
    muted: "#a3a3a3",
    text: "#fafafa",
    divider: "#525252",
    skeleton: "#404040",
    mention: "#60a5fa",
  },
} as const;

export type UIColorName = keyof (typeof uiColors)["light"];

/**
 * A color as a CSS value: the custom property `--sublay-ui-<name>` when an
 * ancestor sets it, otherwise the theme's color. The custom properties let a
 * stylesheet drive the colors (e.g. under a `.dark` class) without a prop.
 */
export const uiColor = (name: UIColorName, theme: UITheme = "light") =>
  `var(--sublay-ui-${name}, ${uiColors[theme][name]})`;
