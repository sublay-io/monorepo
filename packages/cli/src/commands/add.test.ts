import { describe, it, expect, vi, afterEach } from "vitest";
import path from "path";

import { formatUsage, getTargetPath, printAppSetupNotes, resolveFrameworkFile, resolveLanguageFile } from "./add";
import type { SublayConfig } from "./init";

const config: SublayConfig = {
  platform: "react",
  style: "styled",
  typescript: true,
  paths: { components: "src/components" },
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

describe("resolveFrameworkFile", () => {
  const envFile = { path: "utils/env.ts", type: "util", description: "" };
  const registry = {
    files: [envFile],
    frameworks: { next: "env/next.ts", other: "env/other.ts" },
  };

  it("returns the file of a framework the component lists", () => {
    expect(resolveFrameworkFile(registry, "next", "comments-social")).toBe("env/next.ts");
    expect(resolveFrameworkFile(registry, "other", "comments-social")).toBe("env/other.ts");
  });

  it("installs the env file as it is for a framework it doesn't list, or without frameworks", () => {
    expect(resolveFrameworkFile(registry, "vite", "comments-social")).toBeNull();
    expect(resolveFrameworkFile({ files: [] }, "next", "notifications-control")).toBeNull();
  });

  it("does not treat inherited object keys as frameworks", () => {
    expect(
      resolveFrameworkFile(registry, "toString" as never, "comments-social")
    ).toBeNull();
  });

  it("rejects a framework file outside the component", () => {
    for (const bad of ["../../secrets.ts", "/etc/passwd", "env/../../x.ts"]) {
      expect(() =>
        resolveFrameworkFile(
          { files: [envFile], frameworks: { next: bad } },
          "next",
          "comments-social"
        )
      ).toThrow("not a usable file path");
    }
  });

  it("needs an env file to put the framework's version in", () => {
    expect(() =>
      resolveFrameworkFile({ files: [], frameworks: { next: "env/next.ts" } }, "next", "x")
    ).toThrow("has no utils/env.ts");
  });
});

describe("formatUsage", () => {
  it("puts the install path in place of {importPath}", () => {
    expect(
      formatUsage(
        ['import { A, B } from "{importPath}";', "", "<A><B /></A>"],
        "./src/components/comments-threaded"
      )
    ).toEqual([
      'import { A, B } from "./src/components/comments-threaded";',
      "",
      "<A><B /></A>",
    ]);
  });
});

describe("printAppSetupNotes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  const output = (...args: Parameters<typeof printAppSetupNotes>) => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    printAppSetupNotes(...args);
    return log.mock.calls.map((call) => String(call[0])).join("\n");
  };

  it("links NativeWind's install guide for components that use it", () => {
    expect(output(["nativewind@^4.0.0"], "expo")).toContain(
      "https://www.nativewind.dev/docs/getting-started/installation"
    );
  });

  it("tells bare React Native about react-native-worklets when Reanimated was missing", () => {
    expect(
      output(["react-native-reanimated@>=3.16.0"], "react-native", ["react-native-reanimated"])
    ).toContain("react-native-worklets");
  });

  it("says nothing about worklets when Reanimated was already there, or on Expo", () => {
    expect(output(["react-native-reanimated@>=3.16.0"], "react-native", [])).toBe("");
    expect(
      output(["react-native-reanimated@>=3.16.0"], "expo", ["react-native-reanimated"])
    ).toBe("");
  });
});
