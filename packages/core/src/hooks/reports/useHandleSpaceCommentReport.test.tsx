import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useHandleSpaceCommentReport from "./useHandleSpaceCommentReport";

afterEach(() => {
  resetAxiosMocks();
});

describe("useHandleSpaceCommentReport", () => {
  it("submits a moderation decision for a comment report", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceCommentReport(),
    );

    const response = { message: "Report handled", code: "OK" };
    axiosPrivate.mockResponse("patch", response);

    let returned: typeof response | undefined;
    await act(async () => {
      returned = await result.current({
        spaceId: "space-1",
        reportId: "report-1",
        commentId: "comment-1",
        actions: ["remove-comment"],
        summary: "Removed inappropriate comment",
      });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/spaces/space-1/reports/comment/report-1");
    expect(call.body).toMatchObject({
      commentId: "comment-1",
      actions: ["remove-comment"],
      summary: "Removed inappropriate comment",
    });
  });

  it("supports combining ban-user with remove-comment", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceCommentReport(),
    );

    axiosPrivate.mockResponse("patch", { message: "ok", code: "OK" });

    await act(async () => {
      await result.current({
        spaceId: "space-1",
        reportId: "report-1",
        commentId: "comment-1",
        actions: ["remove-comment", "ban-user"],
        summary: "Removed and banned",
        reason: "Repeated harassment",
      });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body).toMatchObject({
      actions: ["remove-comment", "ban-user"],
      reason: "Repeated harassment",
    });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceCommentReport(),
    );

    axiosPrivate.mockError("patch", 403, { message: "Forbidden" });

    await expect(
      result.current({
        spaceId: "space-1",
        reportId: "report-1",
        commentId: "comment-1",
        actions: ["dismiss"],
        summary: "Not a violation",
      }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("throws before making a request when spaceId or reportId is missing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceCommentReport(),
    );

    await expect(
      result.current({
        spaceId: "",
        reportId: "report-1",
        commentId: "comment-1",
        actions: ["dismiss"],
        summary: "Not a violation",
      }),
    ).rejects.toThrow("spaceId and reportId are required");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});
