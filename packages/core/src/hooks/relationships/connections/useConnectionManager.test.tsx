import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser, makeUser } from "../../../test-utils";
import type { ConnectionRow } from "../../../interfaces/models/Connection";
import useConnectionManager from "./useConnectionManager";

afterEach(() => {
  resetAxiosMocks();
});

function makeRow(overrides: Partial<ConnectionRow> = {}): ConnectionRow {
  return {
    id: "connection-1",
    user: makeUser({ id: "user-2" }),
    type: "sent",
    message: null,
    status: "pending",
    createdAt: "2024-01-01T00:00:00.000Z",
    respondedAt: null,
    ...overrides,
  };
}

function renderWithStatus(status: unknown) {
  return renderHookWithAxios(
    () => useConnectionManager({ userId: "user-2" }),
    {
      user: makeAuthUser({ id: "user-1" }),
      beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", status),
    },
  );
}

describe("useConnectionManager", () => {
  it("loads 'none' when no connection exists and sends a connection request", async () => {
    const { result, axiosPrivate } = renderWithStatus({ isConnected: false });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.connectionStatus).toBe("none");
    expect(result.current.connection).toBeNull();

    const sent = makeRow({ message: "Hi there" });
    axiosPrivate.mockResponse("post", sent, 201);

    await act(async () => {
      await result.current.sendConnectionRequest("Hi there");
    });

    expect(result.current.connectionStatus).toBe("pending-sent");
    expect(result.current.connectionId).toBe("connection-1");
    expect(result.current.connection).toEqual(sent);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/users/user-2/connection");
    expect(call.body).toEqual({ message: "Hi there" });
  });

  it("reads an accepted connection as 'accepted'", async () => {
    const accepted = makeRow({ status: "accepted", respondedAt: "2024-01-02T00:00:00.000Z" });
    const { result } = renderWithStatus({ isConnected: true, connection: accepted });

    await waitFor(() => expect(result.current.connectionStatus).toBe("accepted"));
    expect(result.current.connection).toEqual(accepted);
  });

  it("reads a declined request by its direction", async () => {
    const { result } = renderWithStatus({
      isConnected: false,
      connection: makeRow({ status: "declined", respondedAt: "2024-01-02T00:00:00.000Z" }),
    });

    await waitFor(() => expect(result.current.connectionStatus).toBe("declined-sent"));
  });

  it("accepts a received pending request and keeps the returned row", async () => {
    const { result, axiosPrivate } = renderWithStatus({
      isConnected: false,
      connection: makeRow({ type: "received" }),
    });

    await waitFor(() => expect(result.current.connectionStatus).toBe("pending-received"));

    const accepted = makeRow({
      type: "received",
      status: "accepted",
      respondedAt: "2024-01-02T00:00:00.000Z",
    });
    axiosPrivate.mockResponse("patch", accepted);

    await act(async () => {
      await result.current.acceptConnectionRequest();
    });

    expect(result.current.connectionStatus).toBe("accepted");
    expect(result.current.connection).toEqual(accepted);

    const patchCall = axiosPrivate.calls("patch")[0];
    expect(patchCall.url).toBe("/test-project/connections/connection-1/accept");
  });

  it("declines a received pending request", async () => {
    const { result, axiosPrivate } = renderWithStatus({
      isConnected: false,
      connection: makeRow({ type: "received" }),
    });

    await waitFor(() => expect(result.current.connectionStatus).toBe("pending-received"));

    axiosPrivate.mockResponse(
      "patch",
      makeRow({ type: "received", status: "declined", respondedAt: "2024-01-02T00:00:00.000Z" }),
    );

    await act(async () => {
      await result.current.declineConnectionRequest();
    });

    expect(result.current.connectionStatus).toBe("declined-received");
    expect(result.current.connection?.respondedAt).toBe("2024-01-02T00:00:00.000Z");
  });

  it("withdraws a sent pending request", async () => {
    const { result, axiosPrivate } = renderWithStatus({
      isConnected: false,
      connection: makeRow(),
    });

    await waitFor(() => expect(result.current.connectionStatus).toBe("pending-sent"));

    axiosPrivate.mockResponse("delete", "", 204);

    await act(async () => {
      await result.current.withdrawConnectionRequest();
    });

    expect(result.current.connectionStatus).toBe("none");
    expect(result.current.connectionId).toBeNull();
  });

  it("disconnects an accepted connection", async () => {
    const { result, axiosPrivate } = renderWithStatus({
      isConnected: true,
      connection: makeRow({ status: "accepted", respondedAt: "2024-01-02T00:00:00.000Z" }),
    });

    await waitFor(() => expect(result.current.connectionStatus).toBe("accepted"));

    axiosPrivate.mockResponse("delete", "", 204);

    await act(async () => {
      await result.current.disconnectUser();
    });

    expect(result.current.connectionStatus).toBe("none");
    expect(axiosPrivate.calls("delete")[0].url).toBe("/test-project/connections/connection-1");
  });

  it("removeConnectionSmart reads the declined row back after declining a received request", async () => {
    const { result, axiosPrivate } = renderWithStatus({
      isConnected: false,
      connection: makeRow({ type: "received" }),
    });

    await waitFor(() => expect(result.current.connectionStatus).toBe("pending-received"));

    axiosPrivate.mockResponse("delete", "", 204);
    axiosPrivate.mockResponse("get", {
      isConnected: false,
      connection: makeRow({ type: "received", status: "declined", respondedAt: "2024-01-02T00:00:00.000Z" }),
    });

    await act(async () => {
      await result.current.removeConnectionSmart();
    });

    expect(axiosPrivate.calls("delete")[0].url).toBe("/test-project/users/user-2/connection");
    await waitFor(() => expect(result.current.connectionStatus).toBe("declined-received"));
  });

  it("removeConnectionSmart clears the state after withdrawing a sent request", async () => {
    const { result, axiosPrivate } = renderWithStatus({
      isConnected: false,
      connection: makeRow(),
    });

    await waitFor(() => expect(result.current.connectionStatus).toBe("pending-sent"));

    axiosPrivate.mockResponse("delete", "", 204);

    await act(async () => {
      await result.current.removeConnectionSmart();
    });

    expect(result.current.connectionStatus).toBe("none");
    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("treats checking your own userId as 'none' without making a request", async () => {
    const user = makeAuthUser({ id: "user-1" });

    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useConnectionManager({ userId: "user-1" }),
      { user },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.connectionStatus).toBe("none");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("falls back to 'none' without throwing when the status fetch fails", async () => {
    const user = makeAuthUser({ id: "user-1" });

    const { result } = renderHookWithAxios(
      () => useConnectionManager({ userId: "user-2" }),
      {
        user,
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockError("get", 500, { message: "Internal error" }),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.connectionStatus).toBe("none");
  });
});
