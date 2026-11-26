import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useFetchInvitees from "./useFetchInvitees";
import type { EventInvite } from "../../interfaces/models/Event";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";

afterEach(() => {
  resetAxiosMocks();
});

function makeInvite(overrides: Partial<EventInvite> = {}): EventInvite {
  return {
    id: "invite-1",
    eventId: "event-1",
    userId: "user-2",
    invitedAt: "2024-01-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makePage(invites: EventInvite[]): PaginatedResponse<EventInvite> {
  return {
    data: invites,
    pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: invites.length, hasMore: false },
  };
}

describe("useFetchInvitees", () => {
  it("fetches the host-only invitee list for an event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchInvitees());

    const page = makePage([makeInvite()]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<EventInvite> | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1", page: 1, limit: 10 });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/events/event-1/invites");
    expect(call.config?.params).toMatchObject({ page: 1, limit: 10 });
  });

  it("rejects when the server returns an error response (e.g. non-host viewer)", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchInvitees());

    axiosPrivate.mockError("get", 403, { message: "Forbidden" });

    await expect(
      result.current({ eventId: "event-1" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchInvitees(), {
      projectId: "",
    });

    await expect(result.current({ eventId: "event-1" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
