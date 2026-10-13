import { describe, it, expect } from "vitest";

import {
  findDependencyStatus,
  isDeclaredRangeBelow,
  mergeDependencies,
  parseDependencyName,
  parseDependencySpec,
} from "./dependencies";

describe("parseDependencyName", () => {
  it("keeps the scope on a scoped package with a version", () => {
    expect(parseDependencyName("@sublay/react-js@^7.0.0")).toBe(
      "@sublay/react-js"
    );
  });

  it("keeps the scope on a scoped package with no version", () => {
    expect(parseDependencyName("@sublay/react-js")).toBe("@sublay/react-js");
  });

  it("strips the version from an unscoped package", () => {
    expect(parseDependencyName("lucide-react@^1.0.0")).toBe("lucide-react");
  });

  it("passes an unscoped package with no version through", () => {
    expect(parseDependencyName("lucide-react")).toBe("lucide-react");
  });
});

describe("parseDependencySpec", () => {
  it("splits a scoped package from its range", () => {
    expect(parseDependencySpec("@sublay/react-js@^8.0.0-beta.0")).toEqual({
      name: "@sublay/react-js",
      range: "^8.0.0-beta.0",
    });
  });

  it("splits an unscoped package from its range", () => {
    expect(parseDependencySpec("moment@^2")).toEqual({ name: "moment", range: "^2" });
  });

  it("gives an empty range when there is none", () => {
    expect(parseDependencySpec("@sublay/react-js")).toEqual({
      name: "@sublay/react-js",
      range: "",
    });
    expect(parseDependencySpec("lucide-react")).toEqual({ name: "lucide-react", range: "" });
  });
});

describe("mergeDependencies", () => {
  it("appends the shared pieces' packages to the component's", () => {
    expect(
      mergeDependencies(
        ["@sublay/react-js@^8.0.0-beta.0", "lucide-react@^1.0.0"],
        ["moment@^2", "@giphy/react-components@^10.1.1"]
      )
    ).toEqual([
      "@sublay/react-js@^8.0.0-beta.0",
      "lucide-react@^1.0.0",
      "moment@^2",
      "@giphy/react-components@^10.1.1",
    ]);
  });

  it("keeps one spec per package, and the component's when both declare it", () => {
    expect(
      mergeDependencies(
        ["react-native-gesture-handler@^2.20.0"],
        ["react-native-gesture-handler@^2", "react-native-svg@^15"]
      )
    ).toEqual(["react-native-gesture-handler@^2.20.0", "react-native-svg@^15"]);
  });

  it("keeps one spec when two pieces declare the same package", () => {
    expect(
      mergeDependencies([], ["@giphy/js-fetch-api@^5.7.0", "moment@^2", "@giphy/js-fetch-api@^5.7.0"])
    ).toEqual(["@giphy/js-fetch-api@^5.7.0", "moment@^2"]);
  });

  it("returns the component's list unchanged when there are no shared pieces", () => {
    const deps = ["@sublay/react-js@^7.0.0", "@sublay/ui-core-react-js@^7.0.0"];
    expect(mergeDependencies(deps, [])).toEqual(deps);
  });
});

describe("isDeclaredRangeBelow", () => {
  it("is true when the declared range sits entirely below the required one", () => {
    expect(isDeclaredRangeBelow("^6.2.0", "^7.0.0")).toBe(true);
    expect(isDeclaredRangeBelow("7.13.5", "^8.0.0")).toBe(true);
    expect(isDeclaredRangeBelow("~7.13.0", ">=8")).toBe(true);
  });

  it("is true for a stable 7.x range against a prerelease requirement", () => {
    expect(isDeclaredRangeBelow("^7.13.5", "^8.0.0-beta.0")).toBe(true);
    expect(isDeclaredRangeBelow("7.13.5", "^8.0.0-beta.0")).toBe(true);
  });

  it("is true for an older prerelease pin than the required prerelease", () => {
    expect(isDeclaredRangeBelow("8.0.0-beta.0", "^8.0.0-beta.2")).toBe(true);
  });

  it("is false when the ranges overlap", () => {
    expect(isDeclaredRangeBelow("^7.0.0", "^7.0.0")).toBe(false);
    expect(isDeclaredRangeBelow("^7.13.5", "^7.0.0")).toBe(false);
    expect(isDeclaredRangeBelow("7.2.0", "^7.0.0")).toBe(false);
    expect(isDeclaredRangeBelow(">=7", "^8.0.0-beta.0")).toBe(false);
    expect(isDeclaredRangeBelow("*", "^8.0.0-beta.0")).toBe(false);
    expect(isDeclaredRangeBelow("^8.0.0-beta.3", "^8.0.0-beta.0")).toBe(false);
    expect(isDeclaredRangeBelow("8.0.0-beta.3", "^8.0.0-beta.0")).toBe(false);
  });

  it("is false when the declared range sits above the required one", () => {
    expect(isDeclaredRangeBelow("^8.0.0-beta.1", "^7.0.0")).toBe(false);
    expect(isDeclaredRangeBelow("^8.0.0", "^7.0.0")).toBe(false);
    expect(isDeclaredRangeBelow("9.1.0", "^7.0.0")).toBe(false);
  });

  it("is false for anything that is not a plain version range", () => {
    for (const declared of [
      "workspace:*",
      "workspace:^",
      "latest",
      "beta",
      "next",
      "github:sublay-io/monorepo",
      "git+https://github.com/sublay-io/monorepo.git",
      "file:../react-js",
      "link:../react-js",
      "npm:@other/pkg@^1.0.0",
      "https://example.com/pkg.tgz",
    ]) {
      expect(isDeclaredRangeBelow(declared, "^8.0.0-beta.0")).toBe(false);
    }
  });

  it("is false when the requirement has no usable range", () => {
    expect(isDeclaredRangeBelow("^7.0.0", "")).toBe(false);
    expect(isDeclaredRangeBelow("^7.0.0", "latest")).toBe(false);
  });
});

describe("findDependencyStatus", () => {
  it("lists a package the project does not declare as missing", () => {
    expect(
      findDependencyStatus(["@sublay/react-js@^7.0.0", "lucide-react@^1.0.0"], {
        "lucide-react": "^1.8.0",
      })
    ).toEqual({ missing: ["@sublay/react-js@^7.0.0"], upgrades: [] });
  });

  it("reports nothing when everything is declared at a matching range", () => {
    expect(
      findDependencyStatus(["@sublay/react-js@^7.0.0", "@sublay/ui-core-react-js@^7.0.0"], {
        "@sublay/react-js": "^7.13.5",
        "@sublay/ui-core-react-js": "^7.0.1",
      })
    ).toEqual({ missing: [], upgrades: [] });
  });

  it("offers an upgrade to a 7.x project adding a component that needs the 8.x beta", () => {
    expect(
      findDependencyStatus(["@sublay/react-js@^8.0.0-beta.0"], {
        "@sublay/react-js": "^7.13.5",
      })
    ).toEqual({
      missing: [],
      upgrades: [{ spec: "@sublay/react-js@^8.0.0-beta.0", declared: "^7.13.5" }],
    });
  });

  it("offers the upgrade under the Expo package name once the spec is renamed", () => {
    // add.ts renames @sublay/react-native to @sublay/expo before this check.
    expect(
      findDependencyStatus(["@sublay/expo@^8.0.0-beta.0"], {
        "@sublay/expo": "^7.13.5",
        "@sublay/react-native": "^7.13.5",
      })
    ).toEqual({
      missing: [],
      upgrades: [{ spec: "@sublay/expo@^8.0.0-beta.0", declared: "^7.13.5" }],
    });
  });

  it("offers nothing to an 8.x beta project adding a component that needs 7.x", () => {
    expect(
      findDependencyStatus(["@sublay/react-js@^7.0.0"], {
        "@sublay/react-js": "^8.0.0-beta.4",
      })
    ).toEqual({ missing: [], upgrades: [] });
  });

  it("treats workspace, tag and git specifiers of a @sublay package as present", () => {
    for (const declared of ["workspace:*", "latest", "github:sublay-io/monorepo", "file:../x"]) {
      expect(
        findDependencyStatus(["@sublay/react-js@^8.0.0-beta.0"], {
          "@sublay/react-js": declared,
        })
      ).toEqual({ missing: [], upgrades: [] });
    }
  });

  it("never compares versions of a third-party package", () => {
    expect(
      findDependencyStatus(
        [
          "lucide-react@^1.0.0",
          "framer-motion@^12.0.0",
          "react-native-gesture-handler@^2.20.0",
          "react-native-reanimated@^4.0.0",
        ],
        {
          "lucide-react": "^0.400.0",
          "framer-motion": "^10.0.0",
          "react-native-gesture-handler": "^1.10.0",
          "react-native-reanimated": "^3.6.0",
        }
      )
    ).toEqual({ missing: [], upgrades: [] });
  });

  it("checks the merged list, so a piece's package is reported once with the component's range", () => {
    const merged = mergeDependencies(
      ["@sublay/react-native@^8.0.0-beta.0", "react-native-gesture-handler@^2.20.0"],
      ["react-native-gesture-handler@^2", "react-native-svg@^15", "moment@^2"]
    );
    expect(findDependencyStatus(merged, { moment: "^2.30.0" })).toEqual({
      missing: [
        "@sublay/react-native@^8.0.0-beta.0",
        "react-native-gesture-handler@^2.20.0",
        "react-native-svg@^15",
      ],
      upgrades: [],
    });
  });
});
