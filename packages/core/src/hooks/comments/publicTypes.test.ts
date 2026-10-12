import { describe, it, expectTypeOf } from "vitest";

// Type-only: checked by `pnpm typecheck` (tsc), erased at runtime.
import type {
  CommentSectionContextValues,
  CommentSectionProviderProps,
  CommentsSortByOptions,
  UseCommentSectionDataProps,
  UseCommentSectionDataValues,
  UseEntityCommentsValues,
} from "../../index";

describe("comment section — public types", () => {
  it("exports the section's props and values from the package root", () => {
    expectTypeOf<CommentSectionProviderProps>().toMatchTypeOf<UseCommentSectionDataProps>();
    expectTypeOf<CommentSectionContextValues>().toMatchTypeOf<UseCommentSectionDataValues>();
    expectTypeOf<CommentSectionProviderProps>().toHaveProperty("children");
  });

  it("`sortBy` is never null", () => {
    expectTypeOf<UseCommentSectionDataValues["sortBy"]>().toEqualTypeOf<CommentsSortByOptions>();
    expectTypeOf<UseEntityCommentsValues["sortBy"]>().toEqualTypeOf<CommentsSortByOptions>();
  });
});
