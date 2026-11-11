import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useHandleSpaceEntityReport from "./useHandleSpaceEntityReport";

afterEach(() => {
  resetAxiosMocks();
});

describe("useHandleSpaceEntityReport", () => {
  it("submits a moderation decision for an entity report", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceEntityReport(),
    );

    axiosPrivate.mockResponse("patch", "", 204);

    let returned: unknown = "unset";
    await act(async () => {
      returned = await result.current({
        spaceId: "space-1",
        reportId: "report-1",
        entityId: "entity-1",
        actions: ["remove-entity", "ban-user"],
        summary: "Removed spam content and banned user",
        reason: "Spamming",
      });
    });

    // 204, no body: the hook resolves with nothing.
    expect(returned).toBeUndefined();

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/spaces/space-1/reports/entity/report-1");
    expect(call.body).toMatchObject({
      entityId: "entity-1",
      actions: ["remove-entity", "ban-user"],
      reason: "Spamming",
    });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceEntityReport(),
    );

    axiosPrivate.mockError("patch", 403, { message: "Forbidden" });

    await expect(
      result.current({
        spaceId: "space-1",
        reportId: "report-1",
        entityId: "entity-1",
        actions: ["dismiss"],
        summary: "Not a violation",
      }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("throws before making a request when spaceId or reportId is missing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useHandleSpaceEntityReport(),
    );

    await expect(
      result.current({
        spaceId: "space-1",
        reportId: "",
        entityId: "entity-1",
        actions: ["dismiss"],
        summary: "Not a violation",
      }),
    ).rejects.toThrow("spaceId and reportId are required");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useHandleSpaceEntityReport(),
      { projectId: "" },
    );

    await expect(
      result.current({
        spaceId: "space-1",
        reportId: "report-1",
        entityId: "entity-1",
        actions: ["dismiss"],
        summary: "Not a violation",
      }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});
