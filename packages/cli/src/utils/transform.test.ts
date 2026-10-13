import { describe, it, expect } from "vitest";

import { findSharedAliasImports, transformImports } from "./transform";
import type { SublayConfig } from "../commands/init";

function makeConfig(
  platform: SublayConfig["platform"] = "react"
): SublayConfig {
  return {
    platform,
    style: "styled",
    typescript: true,
    paths: { components: "src/components" },
    aliases: { "@/components": "./src/components" },
  };
}

describe("transformImports — registry 'files/' rewrite", () => {
  // Regression guard for the quote-mismatch bug: the replacements used to
  // hardcode one quote character, so a double-quoted source produced
  // `from "../components/x'` — syntactically broken output that still
  // "contained" the right path. Assert the whole string, not a substring.

  it("rewrites a single-quoted named import", () => {
    expect(
      transformImports(
        "import { Foo } from '../files/bar';",
        makeConfig()
      )
    ).toBe("import { Foo } from '../components/bar';");
  });

  it("rewrites a double-quoted named import", () => {
    expect(
      transformImports(
        'import { Foo } from "../files/bar";',
        makeConfig()
      )
    ).toBe('import { Foo } from "../components/bar";');
  });

  it("rewrites a single-quoted side-effect import", () => {
    expect(transformImports("import '../files/bar';", makeConfig())).toBe(
      "import '../components/bar';"
    );
  });

  it("rewrites a double-quoted side-effect import", () => {
    expect(transformImports('import "../files/bar";', makeConfig())).toBe(
      'import "../components/bar";'
    );
  });

  it("rewrites a single-quoted dynamic import", () => {
    expect(
      transformImports("const m = await import('../files/bar');", makeConfig())
    ).toBe("const m = await import('../components/bar');");
  });

  it("rewrites a double-quoted dynamic import", () => {
    expect(
      transformImports('const m = await import("../files/bar");', makeConfig())
    ).toBe('const m = await import("../components/bar");');
  });

  it("leaves non-registry paths untouched", () => {
    const source = [
      "import { Foo } from './files/bar';",
      "import { Baz } from '../hooks/useBaz';",
    ].join("\n");

    expect(transformImports(source, makeConfig())).toBe(source);
  });
});

describe("transformImports — expo package rewrite", () => {
  it("rewrites @sublay/react-native to @sublay/expo on the expo platform", () => {
    // Note: the replacement normalises to double quotes regardless of input.
    expect(
      transformImports(
        "import { useAuth } from '@sublay/react-native';",
        makeConfig("expo")
      )
    ).toBe('import { useAuth } from "@sublay/expo";');

    expect(
      transformImports(
        'import { useAuth } from "@sublay/react-native";',
        makeConfig("expo")
      )
    ).toBe('import { useAuth } from "@sublay/expo";');
  });

  it("leaves @sublay/react-native alone on the react-native platform", () => {
    const source = 'import { useAuth } from "@sublay/react-native";';

    expect(transformImports(source, makeConfig("react-native"))).toBe(source);
  });

  it("names @sublay/expo in the file header's dependency list on expo", () => {
    const source = [
      "/**",
      " * Required dependencies:",
      " * - @sublay/react-native ^8.0.0-beta.0",
      " * - @sublay/ui-core-react-native ^7.0.0",
      " * - @gorhom/bottom-sheet",
      " */",
    ].join("\n");

    expect(transformImports(source, makeConfig("expo"))).toBe(
      [
        "/**",
        " * Required dependencies:",
        " * - @sublay/expo ^8.0.0-beta.0",
        " * - @sublay/ui-core-react-native ^7.0.0",
        " * - @gorhom/bottom-sheet",
        " */",
      ].join("\n")
    );
  });

  it("leaves the header's dependency list alone on the react-native platform", () => {
    const source = " * - @sublay/react-native ^8.0.0-beta.0";

    expect(transformImports(source, makeConfig("react-native"))).toBe(source);
  });
});

describe("transformImports — shared piece alias", () => {
  const at = (installedPath: string) => ({ installedPath });

  it("rewrites the alias from a file at the top of components/", () => {
    expect(
      transformImports(
        'import { GiphyContainer } from "~shared/react/giphy-container";',
        makeConfig(),
        at("components/social-comment-section.tsx")
      )
    ).toBe('import { GiphyContainer } from "../shared/giphy-container";');
  });

  it("rewrites the alias from a file nested several folders deep", () => {
    expect(
      transformImports(
        "import { UserAvatar } from '~shared/react/user-avatar';",
        makeConfig(),
        at("components/comments-feed/comment/comment.tsx")
      )
    ).toBe("import { UserAvatar } from '../../../shared/user-avatar';");
  });

  it("rewrites the alias from hooks/, utils/ and context/", () => {
    for (const folder of ["hooks", "utils", "context"]) {
      expect(
        transformImports(
          'import { resetButton } from "~shared/react/reset-styles";',
          makeConfig(),
          at(`${folder}/thing.ts`)
        )
      ).toBe('import { resetButton } from "../shared/reset-styles";');
    }
  });

  it("rewrites the alias from a file at the component root", () => {
    expect(
      transformImports(
        'import { Modal } from "~shared/react/modal";',
        makeConfig(),
        at("thing.tsx")
      )
    ).toBe('import { Modal } from "./shared/modal";');
  });

  it("rewrites the alias inside the shared folder to a sibling import", () => {
    expect(
      transformImports(
        'import { Modal } from "~shared/react/modal";',
        makeConfig(),
        at("shared/other.tsx")
      )
    ).toBe('import { Modal } from "./modal";');
  });

  it("rewrites the react-native alias", () => {
    expect(
      transformImports(
        'import { FromNow } from "~shared/react-native/from-now";',
        makeConfig("react-native"),
        at("components/comments-feed/comment.tsx")
      )
    ).toBe('import { FromNow } from "../../shared/from-now";');
  });

  it("rewrites type imports, re-exports and multi-line imports", () => {
    const source = [
      'import type { ModalProps } from "~shared/react/modal";',
      'export { Modal } from "~shared/react/modal";',
      "import {",
      "  CommentSkeleton,",
      "  ReplySkeleton,",
      '} from "~shared/react/skeleton";',
    ].join("\n");

    expect(transformImports(source, makeConfig(), at("components/a/b.tsx"))).toBe(
      [
        'import type { ModalProps } from "../../shared/modal";',
        'export { Modal } from "../../shared/modal";',
        "import {",
        "  CommentSkeleton,",
        "  ReplySkeleton,",
        '} from "../../shared/skeleton";',
      ].join("\n")
    );
  });

  it("rewrites a side-effect import", () => {
    expect(
      transformImports(
        "import '~shared/react/reset-styles';",
        makeConfig(),
        at("components/a.tsx")
      )
    ).toBe("import '../shared/reset-styles';");
  });

  it("rewrites a dynamic import", () => {
    expect(
      transformImports(
        'const m = await import("~shared/react/giphy-container");',
        makeConfig(),
        at("components/a/b/c.tsx")
      )
    ).toBe('const m = await import("../../../shared/giphy-container");');
  });

  it("leaves no alias behind when a file imports several pieces", () => {
    const out = transformImports(
      [
        'import { A } from "~shared/react/a";',
        "import { B } from '~shared/react/b';",
        'import("~shared/react/c");',
      ].join("\n"),
      makeConfig(),
      at("components/x.tsx")
    );
    expect(out).not.toContain("~shared/");
  });

  it("leaves other imports alone", () => {
    const source = [
      'import { cn } from "@/lib/utils";',
      'import { useThing } from "../hooks/use-thing";',
      'import { Foo } from "../files/foo";',
      'import { useUser } from "@sublay/react-js";',
      'import shared from "./shared/local";',
    ].join("\n");

    expect(transformImports(source, makeConfig(), at("components/x.tsx"))).toBe(
      [
        'import { cn } from "@/lib/utils";',
        'import { useThing } from "../hooks/use-thing";',
        'import { Foo } from "../components/foo";',
        'import { useUser } from "@sublay/react-js";',
        'import shared from "./shared/local";',
      ].join("\n")
    );
  });

  it("applies the expo package rename and the alias rewrite together", () => {
    expect(
      transformImports(
        [
          'import { useUser } from "@sublay/react-native";',
          'import { FromNow } from "~shared/react-native/from-now";',
        ].join("\n"),
        makeConfig("expo"),
        at("components/x.tsx")
      )
    ).toBe(
      [
        'import { useUser } from "@sublay/expo";',
        'import { FromNow } from "../shared/from-now";',
      ].join("\n")
    );
  });
});

describe("findSharedAliasImports", () => {
  it("lists every shared piece a file imports, in every import form", () => {
    expect(
      findSharedAliasImports(
        [
          'import { A } from "~shared/react/a";',
          "import '~shared/react/b';",
          'await import("~shared/react-native/c");',
          'import { cn } from "@/lib/utils";',
        ].join("\n")
      )
    ).toEqual([
      { platform: "react", piece: "a" },
      { platform: "react", piece: "b" },
      { platform: "react-native", piece: "c" },
    ]);
  });

  it("finds nothing in a file without shared imports", () => {
    expect(findSharedAliasImports('import { A } from "../files/a";')).toEqual([]);
  });
});
