import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useDeleteComment from "./useDeleteComment";

afterEach(() => {
  resetAxiosMocks();
});

describe("useDeleteComment", () => {
  it("deletes the comment", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteComment());

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current({ commentId: "comment-1" });
    });

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/comments/comment-1");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteComment());

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ commentId: "comment-1" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when no comment ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteComment());

    await expect(result.current({ commentId: "" })).rejects.toThrow(
      "No comment ID passed",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteComment(), {
      projectId: "",
    });

    await expect(
      result.current({ commentId: "comment-1" }),
    ).rejects.toThrow("No project specified");
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});
