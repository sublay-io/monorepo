import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useModerateSpaceComment from "./useModerateSpaceComment";

afterEach(() => {
  resetAxiosMocks();
});

describe("useModerateSpaceComment", () => {
  it("removes a comment with a reason", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useModerateSpaceComment(),
    );

    axiosPrivate.mockResponse("patch", { moderationStatus: "removed" });

    let returned;
    await act(async () => {
      returned = await result.current({
        spaceId: "space-1",
        commentId: "comment-1",
        action: "remove",
        reason: "Spam content",
      });
    });

    expect(returned).toEqual({ moderationStatus: "removed" });

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/spaces/space-1/comments/comment-1/moderation");
    expect(call.body).toEqual({ action: "remove", reason: "Spam content" });
  });

  it("approves a comment", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useModerateSpaceComment(),
    );

    axiosPrivate.mockResponse("patch", { moderationStatus: "approved" });

    await act(async () => {
      await result.current({ spaceId: "space-1", commentId: "comment-1", action: "approve" });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body).toEqual({ action: "approve", reason: undefined });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useModerateSpaceComment(),
    );

    axiosPrivate.mockError("patch", 403, { message: "Forbidden" });

    await expect(
      result.current({ spaceId: "space-1", commentId: "comment-1", action: "remove" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("throws before making a request when required fields are missing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useModerateSpaceComment(),
    );

    await expect(
      result.current({ spaceId: "space-1", commentId: "", action: "remove" }),
    ).rejects.toThrow("spaceId and commentId are required.");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});
