import { describe, it, expect } from "vitest";

import { buildConfig } from "./init";

describe("buildConfig", () => {
  it("writes the answers, with no aliases", () => {
    expect(
      buildConfig({ platform: "expo", style: "tailwind", componentsPath: "components" }, true)
    ).toEqual({
      platform: "expo",
      style: "tailwind",
      typescript: true,
      paths: { components: "components" },
    });
  });

  it("defaults the style and the components path", () => {
    expect(buildConfig({ platform: "react" }, false)).toEqual({
      platform: "react",
      style: "styled",
      typescript: false,
      paths: { components: "src/components" },
    });
  });
});
