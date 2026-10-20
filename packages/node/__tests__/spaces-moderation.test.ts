import {
  createRule,
  deleteRule,
  fetchManyRules,
  fetchRule,
  getSpaceConversation,
  handleCommentReport,
  handleEntityReport,
  handleSpaceChatReport,
  moderateSpaceChatMessage,
  moderateSpaceComment,
  moderateSpaceEntity,
  reorderRules,
  updateRule,
} from "../src/modules/spaces";
import { makeClient } from "./helpers/mockClient";

describe("node-sdk spaces (moderation/reports) — request shaping", () => {
  it("handleEntityReport strips spaceId/reportId into the path and patches the rest, covering multiple action types", async () => {
    const { client, projectInstance } = makeClient();
    await handleEntityReport(client, {
      spaceId: "s1",
      reportId: "r1",
      entityId: "e1",
      actions: ["remove-entity", "ban-user"],
      actingUserId: "u-actor",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/reports/entity/r1",
      { entityId: "e1", actions: ["remove-entity", "ban-user"], actingUserId: "u-actor" },
    );
  });

  it("handleCommentReport strips spaceId/reportId into the path and patches the rest, covering multiple action types", async () => {
    const { client, projectInstance } = makeClient();
    await handleCommentReport(client, {
      spaceId: "s1",
      reportId: "r1",
      commentId: "c1",
      actions: ["remove-comment", "dismiss"],
      actingUserId: "u-actor",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/reports/comment/r1",
      { commentId: "c1", actions: ["remove-comment", "dismiss"], actingUserId: "u-actor" },
    );
  });

  it("moderateSpaceEntity strips spaceId/entityId into the path and patches the rest", async () => {
    const { client, projectInstance } = makeClient();
    await moderateSpaceEntity(client, {
      spaceId: "s1",
      entityId: "e1",
      action: "remove",
      actingUserId: "u-actor",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/entities/e1/moderation",
      { action: "remove", actingUserId: "u-actor" },
    );
  });

  it("moderateSpaceComment strips spaceId/commentId into the path and patches the rest", async () => {
    const { client, projectInstance } = makeClient();
    await moderateSpaceComment(client, {
      spaceId: "s1",
      commentId: "c1",
      action: "approve",
      actingUserId: "u-actor",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/comments/c1/moderation",
      { action: "approve", actingUserId: "u-actor" },
    );
  });

  it("getSpaceConversation sends userId as a param", async () => {
    const { client, projectInstance } = makeClient();
    await getSpaceConversation(client, { spaceId: "s1", userId: "u1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/conversation", {
      params: { userId: "u1" },
    });
  });

  it("moderateSpaceChatMessage sends the body as-is, including actingUserId, with no extra client-side gating", async () => {
    const { client, projectInstance } = makeClient();
    await moderateSpaceChatMessage(client, {
      spaceId: "s1",
      messageId: "msg1",
      moderationStatus: "removed",
      actingUserId: "mod1",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/chat/messages/msg1/moderation",
      { moderationStatus: "removed", actingUserId: "mod1" },
    );
  });

  it("handleSpaceChatReport sends the body as-is, including actingUserId, with no extra client-side gating", async () => {
    const { client, projectInstance } = makeClient();
    await handleSpaceChatReport(client, {
      spaceId: "s1",
      reportId: "r1",
      actions: ["remove-message", "ban-user"],
      reason: "spam",
      messageId: "msg1",
      actingUserId: "mod1",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/chat/reports/r1",
      {
        actions: ["remove-message", "ban-user"],
        reason: "spam",
        messageId: "msg1",
        actingUserId: "mod1",
      },
    );
  });

  it("createRule strips spaceId into the path and posts the rest", async () => {
    const { client, projectInstance } = makeClient();
    await createRule(client, { spaceId: "s1", title: "Be nice", actingUserId: "u-actor" });
    expect(projectInstance.post).toHaveBeenCalledWith("/spaces/s1/rules", {
      title: "Be nice",
      actingUserId: "u-actor",
    });
  });

  it("updateRule strips spaceId/ruleId into the path and patches the rest", async () => {
    const { client, projectInstance } = makeClient();
    await updateRule(client, {
      spaceId: "s1",
      ruleId: "r1",
      title: "Updated",
      actingUserId: "u-actor",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith("/spaces/s1/rules/r1", {
      title: "Updated",
      actingUserId: "u-actor",
    });
  });

  it("deleteRule deletes /spaces/:id/rules/:ruleId sending actingUserId as a param", async () => {
    const { client, projectInstance } = makeClient();
    await deleteRule(client, { spaceId: "s1", ruleId: "r1", actingUserId: "u-actor" });
    expect(projectInstance.delete).toHaveBeenCalledWith("/spaces/s1/rules/r1", {
      params: { actingUserId: "u-actor" },
    });
  });

  it("fetchRule hits /spaces/:id/rules/:ruleId with no params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchRule(client, { spaceId: "s1", ruleId: "r1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/rules/r1");
  });

  it("fetchManyRules hits /spaces/:id/rules with no params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchManyRules(client, { spaceId: "s1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/rules");
  });

  it("reorderRules patches the reorder route with ruleIds and actingUserId in the body", async () => {
    const { client, projectInstance } = makeClient();
    await reorderRules(client, { spaceId: "s1", ruleIds: ["r2", "r1"], actingUserId: "u-actor" });
    expect(projectInstance.patch).toHaveBeenCalledWith("/spaces/s1/rules/reorder", {
      ruleIds: ["r2", "r1"],
      actingUserId: "u-actor",
    });
  });
});

describe("node-sdk spaces (moderation/reports) — response mapping", () => {
  it("handleEntityReport returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { message: "handled" };
    projectInstance.patch.mockResolvedValueOnce({ data: result });
    await expect(
      handleEntityReport(client, {
        spaceId: "s1",
        reportId: "r1",
        entityId: "e1",
        actions: ["dismiss"],
        actingUserId: "u-actor",
      }),
    ).resolves.toEqual(result);
  });

  it("handleCommentReport returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { message: "handled" };
    projectInstance.patch.mockResolvedValueOnce({ data: result });
    await expect(
      handleCommentReport(client, {
        spaceId: "s1",
        reportId: "r1",
        commentId: "c1",
        actions: ["dismiss"],
        actingUserId: "u-actor",
      }),
    ).resolves.toEqual(result);
  });

  it("moderateSpaceEntity returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { message: "moderated" };
    projectInstance.patch.mockResolvedValueOnce({ data: result });
    await expect(
      moderateSpaceEntity(client, {
        spaceId: "s1",
        entityId: "e1",
        action: "remove",
        actingUserId: "u-actor",
      }),
    ).resolves.toEqual(result);
  });

  it("moderateSpaceComment returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { message: "moderated" };
    projectInstance.patch.mockResolvedValueOnce({ data: result });
    await expect(
      moderateSpaceComment(client, {
        spaceId: "s1",
        commentId: "c1",
        action: "approve",
        actingUserId: "u-actor",
      }),
    ).resolves.toEqual(result);
  });

  it("getSpaceConversation returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const conversation = { id: "conv1" };
    projectInstance.get.mockResolvedValueOnce({ data: conversation });
    await expect(
      getSpaceConversation(client, { spaceId: "s1", userId: "u1" }),
    ).resolves.toEqual(conversation);
  });

  it("moderateSpaceChatMessage returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { message: "moderated", moderationStatus: "removed" };
    projectInstance.patch.mockResolvedValueOnce({ data: result });
    await expect(
      moderateSpaceChatMessage(client, {
        spaceId: "s1",
        messageId: "msg1",
        moderationStatus: "removed",
        actingUserId: "u-actor",
      }),
    ).resolves.toEqual(result);
  });

  it("handleSpaceChatReport returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { message: "handled", code: "ok" };
    projectInstance.patch.mockResolvedValueOnce({ data: result });
    await expect(
      handleSpaceChatReport(client, {
        spaceId: "s1",
        reportId: "r1",
        actions: ["dismiss"],
        actingUserId: "u-actor",
      }),
    ).resolves.toEqual(result);
  });

  it("createRule returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const rule = { id: "r1", title: "Be nice" };
    projectInstance.post.mockResolvedValueOnce({ data: rule });
    await expect(
      createRule(client, { spaceId: "s1", title: "Be nice", actingUserId: "u-actor" }),
    ).resolves.toEqual(rule);
  });

  it("updateRule returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const rule = { id: "r1", title: "Updated" };
    projectInstance.patch.mockResolvedValueOnce({ data: rule });
    await expect(
      updateRule(client, {
        spaceId: "s1",
        ruleId: "r1",
        title: "Updated",
        actingUserId: "u-actor",
      }),
    ).resolves.toEqual(rule);
  });

  it("deleteRule returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { deleted: true };
    projectInstance.delete.mockResolvedValueOnce({ data: result });
    await expect(
      deleteRule(client, { spaceId: "s1", ruleId: "r1", actingUserId: "u-actor" }),
    ).resolves.toEqual(result);
  });

  it("fetchRule returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const rule = { id: "r1", title: "Be nice" };
    projectInstance.get.mockResolvedValueOnce({ data: rule });
    await expect(fetchRule(client, { spaceId: "s1", ruleId: "r1" })).resolves.toEqual(
      rule,
    );
  });

  it("fetchManyRules returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { rules: [{ id: "r1" }] };
    projectInstance.get.mockResolvedValueOnce({ data: result });
    await expect(fetchManyRules(client, { spaceId: "s1" })).resolves.toEqual(result);
  });

  it("reorderRules returns response.data as an array", async () => {
    const { client, projectInstance } = makeClient();
    const rules = [{ id: "r2" }, { id: "r1" }];
    projectInstance.patch.mockResolvedValueOnce({ data: rules });
    await expect(
      reorderRules(client, { spaceId: "s1", ruleIds: ["r2", "r1"], actingUserId: "u-actor" }),
    ).resolves.toEqual(rules);
  });
});
