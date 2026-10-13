import { describe, it, expect } from "vitest";
import path from "path";

import { getTargetPath, resolveLanguageFile } from "./add";
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

describe("resolveLanguageFile", () => {
  const stringsFile = { path: "utils/strings.ts", type: "util", description: "" };
  const registry = {
    files: [stringsFile],
    languages: { he: "locales/he.ts" },
  };

  it("installs the component as it is without --lang, or in English", () => {
    expect(resolveLanguageFile(registry, undefined, "comments-social")).toBeNull();
    expect(resolveLanguageFile(registry, "en", "comments-social")).toBeNull();
    expect(resolveLanguageFile({ files: [] }, "en", "notifications-control")).toBeNull();
  });

  it("returns the file of a language the component has", () => {
    expect(resolveLanguageFile(registry, "he", "comments-social")).toBe("locales/he.ts");
  });

  it("names the available languages when the one asked for is missing", () => {
    expect(() => resolveLanguageFile(registry, "fr", "comments-social")).toThrow(
      'comments-social is not available in "fr". Available languages: en, he.'
    );
    expect(() =>
      resolveLanguageFile({ files: [stringsFile] }, "he", "notifications-control")
    ).toThrow("Available languages: en.");
  });

  it("does not treat inherited object keys as languages", () => {
    expect(() => resolveLanguageFile(registry, "toString", "comments-social")).toThrow(
      "is not available"
    );
  });

  it("rejects a language file outside the component", () => {
    for (const bad of ["../../secrets.ts", "/etc/passwd", "locales/../../x.ts"]) {
      expect(() =>
        resolveLanguageFile(
          { files: [stringsFile], languages: { he: bad } },
          "he",
          "comments-social"
        )
      ).toThrow("not a usable file path");
    }
  });

  it("needs a strings file to put the language in", () => {
    expect(() =>
      resolveLanguageFile({ files: [], languages: { he: "locales/he.ts" } }, "he", "x")
    ).toThrow("has no utils/strings.ts");
  });
});
