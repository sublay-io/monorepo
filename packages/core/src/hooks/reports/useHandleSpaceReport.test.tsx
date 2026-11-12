import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useHandleSpaceReport from "./useHandleSpaceReport";

afterEach(() => {
  resetAxiosMocks();
});

describe("useHandleSpaceReport", () => {
  it("submits a moderation decision to the one space report route", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceReport(),
    );

    axiosPrivate.mockResponse("patch", "", 204);

    let returned: unknown = "unset";
    await act(async () => {
      returned = await result.current({
        spaceId: "space-1",
        reportId: "report-1",
        actions: ["remove-entity", "ban-user"],
        summary: "Removed spam",
        reason: "Spamming",
      });
    });

    // 204, no body: the hook resolves with nothing.
    expect(returned).toBeUndefined();

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/spaces/space-1/reports/report-1");
    expect(call.body).toEqual({
      actions: ["remove-entity", "ban-user"],
      summary: "Removed spam",
      reason: "Spamming",
    });
  });

  it("sends no target ids, user id or actingUserId (the server reads them from the report and token)", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceReport(),
    );

    axiosPrivate.mockResponse("patch", "", 204);

    await act(async () => {
      await result.current({
        spaceId: "space-1",
        reportId: "report-1",
        actions: ["remove-message"],
        summary: "removed",
      });
    });

    const [call] = axiosPrivate.calls("patch");
    for (const key of ["entityId", "commentId", "messageId", "userId", "actingUserId"]) {
      expect(call.body).not.toHaveProperty(key);
    }
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceReport(),
    );

    axiosPrivate.mockError("patch", 400, { code: "report/invalid-actions" });

    await expect(
      result.current({
        spaceId: "space-1",
        reportId: "report-1",
        actions: ["remove-comment"],
        summary: "removed",
      }),
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("throws before making a request when spaceId or reportId is missing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceReport(),
    );

    await expect(
      result.current({
        spaceId: "space-1",
        reportId: "",
        actions: ["dismiss"],
        summary: "dismissed",
      }),
    ).rejects.toThrow("spaceId and reportId are required");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});
