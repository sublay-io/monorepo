import {
  acceptConnection,
  declineConnection,
  fetchConnections,
  fetchConnectionsCount,
  fetchReceivedPendingConnections,
  fetchSentPendingConnections,
  removeConnection,
} from "../src/modules/connections";
import { makeClient } from "./helpers/client";

describe("js-sdk connections (own graph) — request shaping", () => {
  it("fetchConnections gets /connections with page/limit as params (no userId — own graph)", async () => {
    const { client, projectInstance } = makeClient();
    await fetchConnections(client, { page: 1, limit: 20 });
    expect(projectInstance.get).toHaveBeenCalledWith("/connections", {
      params: { page: 1, limit: 20 },
    });
    const [, config] = projectInstance.get.mock.calls[0];
    expect(config.params).not.toHaveProperty("userId");
  });

  it("fetchConnectionsCount gets /connections/connections-count with no params (no userId — own graph)", async () => {
    const { client, projectInstance } = makeClient();
    await fetchConnectionsCount(client);
    expect(projectInstance.get).toHaveBeenCalledWith("/connections/connections-count");
    const call = projectInstance.get.mock.calls[0];
    expect(call.length).toBe(1);
  });

  it("fetchReceivedPendingConnections gets /connections/pending/received with page/limit as params (no userId)", async () => {
    const { client, projectInstance } = makeClient();
    await fetchReceivedPendingConnections(client, { page: 1, limit: 20 });
    expect(projectInstance.get).toHaveBeenCalledWith(
      "/connections/pending/received",
      { params: { page: 1, limit: 20 } }
    );
    const [, config] = projectInstance.get.mock.calls[0];
    expect(config.params).not.toHaveProperty("userId");
  });

  it("fetchSentPendingConnections gets /connections/pending/sent with page/limit as params (no userId)", async () => {
    const { client, projectInstance } = makeClient();
    await fetchSentPendingConnections(client, { page: 1, limit: 20 });
    expect(projectInstance.get).toHaveBeenCalledWith(
      "/connections/pending/sent",
      { params: { page: 1, limit: 20 } }
    );
    const [, config] = projectInstance.get.mock.calls[0];
    expect(config.params).not.toHaveProperty("userId");
  });

  it("acceptConnection posts /connections/:connectionId/accept with an empty body (no userId — actor derived from token)", async () => {
    const { client, projectInstance } = makeClient();
    await acceptConnection(client, { connectionId: "conn1" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/connections/conn1/accept",
      {}
    );
    const [, body] = projectInstance.post.mock.calls[0];
    expect(body).not.toHaveProperty("userId");
  });

  it("declineConnection posts /connections/:connectionId/decline with an empty body (no userId — actor derived from token)", async () => {
    const { client, projectInstance } = makeClient();
    await declineConnection(client, { connectionId: "conn1" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/connections/conn1/decline",
      {}
    );
    const [, body] = projectInstance.post.mock.calls[0];
    expect(body).not.toHaveProperty("userId");
  });

  it("removeConnection deletes /connections/:connectionId with no params (no userId — actor derived from token)", async () => {
    const { client, projectInstance } = makeClient();
    await removeConnection(client, { connectionId: "conn1" });
    expect(projectInstance.delete).toHaveBeenCalledWith(
      "/connections/conn1"
    );
    const call = projectInstance.delete.mock.calls[0];
    expect(call.length).toBe(1);
  });
});

describe("js-sdk connections (own graph) — response mapping", () => {
  it("fetchConnections returns the full PaginatedResponse<AcceptedConnectionRow> envelope", async () => {
    const { client, projectInstance } = makeClient();
    const envelope = {
      data: [
        {
          id: "conn1",
          user: { id: "u1", username: "alice" },
          status: "accepted",
          createdAt: "2025-12-31T00:00:00.000Z",
          respondedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 1,
        hasMore: false,
      },
    };
    projectInstance.get.mockResolvedValueOnce({ data: envelope });

    const result = await fetchConnections(client, { page: 1 });

    expect(result).toEqual(envelope);
  });

  it("fetchConnectionsCount returns the count wrapper", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.get.mockResolvedValueOnce({ data: { count: 3 } });

    const result = await fetchConnectionsCount(client);

    expect(result).toEqual({ count: 3 });
  });

  it("fetchReceivedPendingConnections returns the full PaginatedResponse<ConnectionRow> envelope", async () => {
    const { client, projectInstance } = makeClient();
    const envelope = {
      data: [
        {
          id: "conn2",
          user: { id: "u2", username: "bob" },
          type: "received",
          message: "hi",
          status: "pending",
          createdAt: "2026-01-01T00:00:00.000Z",
          respondedAt: null,
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 1,
        hasMore: false,
      },
    };
    projectInstance.get.mockResolvedValueOnce({ data: envelope });

    const result = await fetchReceivedPendingConnections(client, { page: 1 });

    expect(result).toEqual(envelope);
  });

  it("fetchSentPendingConnections returns the full PaginatedResponse<ConnectionRow> envelope", async () => {
    const { client, projectInstance } = makeClient();
    const envelope = {
      data: [
        {
          id: "conn3",
          user: { id: "u3", username: "carol" },
          type: "sent",
          message: null,
          status: "pending",
          createdAt: "2026-01-01T00:00:00.000Z",
          respondedAt: null,
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 1,
        hasMore: false,
      },
    };
    projectInstance.get.mockResolvedValueOnce({ data: envelope });

    const result = await fetchSentPendingConnections(client, { page: 1 });

    expect(result).toEqual(envelope);
  });

  it("acceptConnection returns the ConnectionRow", async () => {
    const { client, projectInstance } = makeClient();
    const actionResponse = {
      id: "conn1",
      user: { id: "u2", username: "bob" },
      type: "received",
      message: null,
      status: "accepted",
      createdAt: "2025-12-31T00:00:00.000Z",
      respondedAt: "2026-01-01T00:00:00.000Z",
    };
    projectInstance.post.mockResolvedValueOnce({ data: actionResponse });

    const result = await acceptConnection(client, { connectionId: "conn1" });

    expect(result).toEqual(actionResponse);
  });

  it("declineConnection returns the ConnectionRow", async () => {
    const { client, projectInstance } = makeClient();
    const actionResponse = {
      id: "conn1",
      user: { id: "u2", username: "bob" },
      type: "received",
      message: null,
      status: "declined",
      createdAt: "2025-12-31T00:00:00.000Z",
      respondedAt: "2026-01-01T00:00:00.000Z",
    };
    projectInstance.post.mockResolvedValueOnce({ data: actionResponse });

    const result = await declineConnection(client, { connectionId: "conn1" });

    expect(result).toEqual(actionResponse);
  });

  it("removeConnection resolves to undefined (void)", async () => {
    const { client } = makeClient();

    const result = await removeConnection(client, { connectionId: "conn1" });

    expect(result).toBeUndefined();
  });
});
