import { describe, it, expect } from "vitest";

import { convertFileExtension, stripTypes } from "./strip-types";

describe("stripTypes", () => {
  it("removes types and keeps JSX", async () => {
    const out = await stripTypes(
      "export const A = (p: { x: number }) => <div>{p.x}</div>;",
      "files/a.tsx"
    );
    expect(out).not.toContain(": {");
    expect(out).toContain("<div>");
  });

  it("returns an empty string for an empty file instead of failing", async () => {
    expect(await stripTypes("", "files/empty.ts")).toBe("");
  });

  it("leaves an empty module for a file that holds only types", async () => {
    expect(
      (await stripTypes("export interface Props {\n  a: string;\n}\n", "files/types.ts")).trim()
    ).toBe("export {};");
  });

  it("still fails, naming the file, on source that does not parse", async () => {
    await expect(stripTypes("const = ;", "files/broken.ts")).rejects.toThrow(
      /Failed to strip types from files\/broken\.ts/
    );
  });
});

describe("convertFileExtension", () => {
  it("maps .ts to .js and .tsx to .jsx", () => {
    expect(convertFileExtension("shared/reset-styles.ts")).toBe("shared/reset-styles.js");
    expect(convertFileExtension("files/a/b.tsx")).toBe("files/a/b.jsx");
  });
});
