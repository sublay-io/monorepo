import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { SublayHttpClient } from "../src/core/client";
import { markNotificationAsRead } from "../src/modules/app-notifications";
import { removeConnection } from "../src/modules/connections";
import { createReport } from "../src/modules/reports";
import {
  handleCommentReport,
  handleEntityReport,
  handleSpaceChatReport,
} from "../src/modules/spaces";
import { createFollow, removeConnectionByUserId } from "../src/modules/users";

/**
 * These run through a real axios instance (only the network adapter is
 * replaced), so axios's own response parsing is exercised: a 204 with an empty
 * body must resolve, not fail JSON parsing, and a 201 body must parse like a
 * 200 one.
 */
function clientAnswering(status: number, body: string): SublayHttpClient {
  const client = new SublayHttpClient({ projectId: "p1" });
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => ({
    data: body,
    status,
    statusText: String(status),
    headers: body ? { "content-type": "application/json" } : {},
    config,
  });
  client.projectInstance.defaults.adapter = adapter;
  return client;
}

describe("js-sdk — 204 empty bodies resolve to undefined", () => {
  const cases: [string, (c: SublayHttpClient) => Promise<unknown>][] = [
    ["removeConnection", (c) => removeConnection(c, { connectionId: "c1" })],
    ["removeConnectionByUserId", (c) => removeConnectionByUserId(c, { userId: "u2" })],
    ["markNotificationAsRead", (c) => markNotificationAsRead(c, { notificationId: "n1" })],
    [
      "handleEntityReport",
      (c) =>
        handleEntityReport(c, {
          spaceId: "s1",
          reportId: "r1",
          entityId: "e1",
          actions: ["dismiss"],
        }),
    ],
    [
      "handleCommentReport",
      (c) =>
        handleCommentReport(c, {
          spaceId: "s1",
          reportId: "r1",
          commentId: "cm1",
          actions: ["dismiss"],
        }),
    ],
    [
      "handleSpaceChatReport",
      (c) =>
        handleSpaceChatReport(c, {
          spaceId: "s1",
          reportId: "r1",
          actions: ["dismiss"],
        }),
    ],
  ];

  it.each(cases)("%s", async (_name, call) => {
    await expect(call(clientAnswering(204, ""))).resolves.toBeUndefined();
  });
});

describe("js-sdk — 201 bodies parse like 200 ones", () => {
  it("createReport returns the caller's report record", async () => {
    const record = {
      id: "ur1",
      targetId: "e1",
      targetType: "entity",
      reason: "spam",
      details: null,
      createdAt: "now",
    };
    const client = clientAnswering(201, JSON.stringify(record));
    await expect(
      createReport(client, {
        targetType: "entity",
        targetId: "e1",
        reason: "spam",
      }),
    ).resolves.toEqual(record);
  });

  it("createFollow returns the follow row", async () => {
    const row = { id: "f1", user: { id: "u2" }, createdAt: "now" };
    const client = clientAnswering(201, JSON.stringify(row));
    await expect(
      createFollow(client, { userId: "u2" }),
    ).resolves.toEqual(row);
  });
});
