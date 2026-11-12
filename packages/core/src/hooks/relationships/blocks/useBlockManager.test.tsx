import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser, makeUser } from "../../../test-utils";
import useBlockManager from "./useBlockManager";

afterEach(() => {
  resetAxiosMocks();
});

describe("useBlockManager", () => {
  it("loads the block status on mount and toggles to unblock", async () => {
    const user = makeAuthUser({ id: "user-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useBlockManager({ userId: "user-2" }),
      {
        user,
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            isBlocking: true,
            block: { id: "block-1", user: makeUser({ id: "user-2" }), createdAt: "2024-01-01T00:00:00.000Z" },
          }),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isBlocking).toBe(true);

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current.toggleBlock();
    });

    expect(result.current.isBlocking).toBe(false);
    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/users/user-2/block");
  });

  it("toggles to block when not currently blocking", async () => {
    const user = makeAuthUser({ id: "user-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useBlockManager({ userId: "user-2" }),
      {
        user,
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { isBlocking: false }),
      },
    );

    await waitFor(() => expect(result.current.isBlocking).toBe(false));

    axiosPrivate.mockResponse(
      "post",
      { id: "block-1", user: makeUser({ id: "user-2" }), createdAt: "2024-01-01T00:00:00.000Z" },
      201,
    );

    await act(async () => {
      await result.current.toggleBlock();
    });

    expect(result.current.isBlocking).toBe(true);
    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/users/user-2/block");
  });

  it("does not fetch and stays idle when checking your own userId", () => {
    const user = makeAuthUser({ id: "user-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useBlockManager({ userId: "user-1" }),
      { user },
    );

    expect(result.current.isBlocking).toBeNull();
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("falls back to isBlocking=false without throwing when the status fetch fails", async () => {
    const user = makeAuthUser({ id: "user-1" });

    const { result } = renderHookWithAxios(
      () => useBlockManager({ userId: "user-2" }),
      {
        user,
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockError("get", 500, { message: "Internal error" }),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isBlocking).toBe(false);
  });
});
