import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useUpdateComment from "./useUpdateComment";
import { makeComment } from "./testHelpers";

afterEach(() => {
  resetAxiosMocks();
});

describe("useUpdateComment", () => {
  it("updates the comment content", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateComment());

    const updated = makeComment({ content: "updated" });
    axiosPrivate.mockResponse("patch", updated);

    let returned: typeof updated | undefined;
    await act(async () => {
      returned = await result.current({ commentId: "comment-1", content: "updated" });
    });

    expect(returned).toEqual(updated);

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/comments/comment-1");
    expect(call.body).toEqual({ content: "updated" });
  });

  it("only sends the metadata field when only metadata is provided", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateComment());

    axiosPrivate.mockResponse("patch", makeComment());

    await act(async () => {
      await result.current({ commentId: "comment-1", metadata: { pinned: true } });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body).toEqual({ metadata: { pinned: true } });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateComment());

    axiosPrivate.mockError("patch", 500, { message: "Internal error" });

    await expect(
      result.current({ commentId: "comment-1", content: "updated" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when neither content nor metadata is provided", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateComment());

    await expect(result.current({ commentId: "comment-1" })).rejects.toThrow(
      "Either content or metadata must be provided",
    );
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });

  it("throws before making a request when content is too short", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateComment());

    await expect(
      result.current({ commentId: "comment-1", content: "" }),
    ).rejects.toThrow("Comment is too short");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });

  it("throws before making a request when metadata is not a plain object", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateComment());

    await expect(
      result.current({ commentId: "comment-1", metadata: ["nope"] as any }),
    ).rejects.toThrow("Metadata must be a valid object");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});
