export type UITheme = "light" | "dark";

type UIColors = {
  surface: string;
  control: string;
  muted: string;
  // Input and loading text. Not set in light, so the text keeps the
  // platform's default color there.
  text: string | undefined;
  // Search placeholder. Not set in light, so the placeholder keeps the
  // platform's default color there.
  placeholder: string | undefined;
  divider: string;
  skeleton: string;
  mention: string;
};

/**
 * The colors the presentational components draw with, per theme. Light is the
 * default, so a component rendered without a `theme` looks as it always has.
 */
export const uiColors: Record<UITheme, UIColors> = {
  light: {
    surface: "#ffffff",
    control: "#e5e7eb",
    muted: "#888888",
    text: undefined,
    placeholder: undefined,
    divider: "#e6e6e6",
    skeleton: "#efefef",
    mention: "#1e40af",
  },
  dark: {
    surface: "#262626",
    control: "#404040",
    muted: "#a3a3a3",
    text: "#fafafa",
    placeholder: "#a3a3a3",
    divider: "#525252",
    skeleton: "#404040",
    mention: "#60a5fa",
  },
};
