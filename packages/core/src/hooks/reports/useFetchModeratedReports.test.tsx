import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import useFetchModeratedReports from "./useFetchModeratedReports";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Report } from "../../interfaces/models/Report";

afterEach(() => {
  resetAxiosMocks();
});

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "report-1",
    spaceId: "space-1",
    targetId: "entity-1",
    targetType: "entity",
    reporterCount: 1,
    userReports: [],
    status: "pending",
    actionTaken: null,
    target: { ...makeEntity({ id: "entity-1" }), user: null },
    space: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  } as Report;
}

function makePage(reports: Report[]): PaginatedResponse<Report> {
  return {
    data: reports,
    pagination: { page: 1, pageSize: 20, totalPages: 1, totalItems: reports.length, hasMore: false },
  };
}

describe("useFetchModeratedReports", () => {
  it("fetches reports for a specific space", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchModeratedReports(),
    );

    const page = makePage([makeReport()]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<Report> | undefined;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1", page: 1, limit: 20 });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/reports/moderated");
    expect(call.config?.params).toMatchObject({ spaceId: "space-1", page: 1, limit: 20 });
  });

  it("fetches reports across all moderated spaces when spaceId is omitted", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchModeratedReports(),
    );

    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({ page: 1, limit: 20 });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params.spaceId).toBeUndefined();
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchModeratedReports(),
    );

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ page: 1, limit: 20 }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchModeratedReports(),
      { projectId: "" },
    );

    await expect(result.current({ page: 1 })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
