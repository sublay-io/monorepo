import { describe, it, expect } from "vitest";
import path from "path";

import { getTargetPath } from "./add";
import type { SublayConfig } from "./init";

const config: SublayConfig = {
  platform: "react",
  style: "styled",
  typescript: true,
  paths: { components: "src/components" },
  aliases: { "@/components": "./src/components" },
};

const inComponent = (...parts: string[]) =>
  path.join("src", "components", "comments-social", ...parts);

describe("getTargetPath", () => {
  it("puts a shared piece in the component's shared folder", () => {
    expect(getTargetPath("shared/giphy-container.tsx", config, "comments-social")).toBe(
      inComponent("shared", "giphy-container.tsx")
    );
  });

  it("keeps the extension a JavaScript project gets", () => {
    expect(getTargetPath("shared/reset-styles.js", config, "comments-social")).toBe(
      inComponent("shared", "reset-styles.js")
    );
  });

  it("keeps component files where they have always gone", () => {
    expect(getTargetPath("files/a/b.tsx", config, "comments-social")).toBe(
      inComponent("components", "a", "b.tsx")
    );
    expect(getTargetPath("hooks/use-thing.ts", config, "comments-social")).toBe(
      inComponent("hooks", "use-thing.ts")
    );
    expect(getTargetPath("utils/helper.ts", config, "comments-social")).toBe(
      inComponent("utils", "helper.ts")
    );
    expect(getTargetPath("context/ui-state.tsx", config, "comments-social")).toBe(
      inComponent("context", "ui-state.tsx")
    );
  });
});
