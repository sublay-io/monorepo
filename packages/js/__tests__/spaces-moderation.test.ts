import {
  createRule,
  deleteRule,
  fetchManyRules,
  fetchRule,
  getSpaceConversation,
  handleSpaceReport,
  moderateSpaceChatMessage,
  moderateSpaceComment,
  moderateSpaceEntity,
  reorderRules,
  updateRule,
} from "../src/modules/spaces";
import { makeClient } from "./helpers/client";

describe("js-sdk spaces (moderation/reports) — request shaping", () => {
  it("handleSpaceReport patches the one report route with the actions, keeping spaceId/reportId in the path", async () => {
    const { client, projectInstance } = makeClient();
    await handleSpaceReport(client, {
      spaceId: "s1",
      reportId: "r1",
      actions: ["remove-entity", "ban-user"],
      summary: "Spam",
      reason: "spam",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith("/spaces/s1/reports/r1", {
      actions: ["remove-entity", "ban-user"],
      summary: "Spam",
      reason: "spam",
    });
  });

  it.each([["remove-comment"], ["remove-message"], ["dismiss"]] as const)(
    "handleSpaceReport sends the %s action to the same route",
    async (action) => {
      const { client, projectInstance } = makeClient();
      await handleSpaceReport(client, { spaceId: "s1", reportId: "r1", actions: [action], summary: "handled" });
      expect(projectInstance.patch).toHaveBeenCalledWith("/spaces/s1/reports/r1", {
        actions: [action],
        summary: "handled",
      });
    },
  );

  it("handleSpaceReport sends no target and no ban target: the server reads both from the report", async () => {
    const { client, projectInstance } = makeClient();
    await handleSpaceReport(client, {
      spaceId: "s1",
      reportId: "r1",
      actions: ["ban-user"],
      summary: "banned",
      reason: "spam",
    });
    const [, body] = projectInstance.patch.mock.calls[0];
    for (const key of ["entityId", "commentId", "messageId", "userId", "spaceId", "reportId"]) {
      expect(body).not.toHaveProperty(key);
    }
  });

  it("moderateSpaceEntity strips spaceId/entityId into the path and patches the rest", async () => {
    const { client, projectInstance } = makeClient();
    await moderateSpaceEntity(client, {
      spaceId: "s1",
      entityId: "e1",
      action: "remove",
      reason: "spam",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/entities/e1/moderation",
      { action: "remove", reason: "spam" }
    );
  });

  it("moderateSpaceComment strips spaceId/commentId into the path and patches the rest", async () => {
    const { client, projectInstance } = makeClient();
    await moderateSpaceComment(client, {
      spaceId: "s1",
      commentId: "c1",
      action: "approve",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/comments/c1/moderation",
      { action: "approve" }
    );
  });

  it("getSpaceConversation hits the conversation route with no params (no userId — actor derived from token)", async () => {
    const { client, projectInstance } = makeClient();
    await getSpaceConversation(client, { spaceId: "s1" });
    expect(projectInstance.get).toHaveBeenCalledWith(
      "/spaces/s1/conversation"
    );
    expect(projectInstance.get.mock.calls[0]).toHaveLength(1);
  });

  it("moderateSpaceChatMessage strips spaceId/messageId into the path and patches the rest, no actingUserId field", async () => {
    const { client, projectInstance } = makeClient();
    await moderateSpaceChatMessage(client, {
      spaceId: "s1",
      messageId: "msg1",
      action: "remove",
      reason: "abuse",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/chat/messages/msg1/moderation",
      { action: "remove", reason: "abuse" }
    );
  });

  it("createRule strips spaceId into the path and posts the rest", async () => {
    const { client, projectInstance } = makeClient();
    await createRule(client, {
      spaceId: "s1",
      title: "Be nice",
      description: "Don't be a jerk",
    });
    expect(projectInstance.post).toHaveBeenCalledWith("/spaces/s1/rules", {
      title: "Be nice",
      description: "Don't be a jerk",
    });
  });

  it("fetchRule hits /spaces/:spaceId/rules/:ruleId with no params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchRule(client, { spaceId: "s1", ruleId: "r1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/rules/r1");
    expect(projectInstance.get.mock.calls[0]).toHaveLength(1);
  });

  it("fetchManyRules hits /spaces/:spaceId/rules with no params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchManyRules(client, { spaceId: "s1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/rules");
    expect(projectInstance.get.mock.calls[0]).toHaveLength(1);
  });

  it("updateRule strips spaceId/ruleId into the path and patches the rest", async () => {
    const { client, projectInstance } = makeClient();
    await updateRule(client, {
      spaceId: "s1",
      ruleId: "r1",
      title: "Updated title",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/rules/r1",
      { title: "Updated title" }
    );
  });

  it("deleteRule deletes /spaces/:spaceId/rules/:ruleId", async () => {
    const { client, projectInstance } = makeClient();
    await deleteRule(client, { spaceId: "s1", ruleId: "r1" });
    expect(projectInstance.delete).toHaveBeenCalledWith(
      "/spaces/s1/rules/r1"
    );
  });

  it("reorderRules posts the reorder route with ruleIds in the body", async () => {
    const { client, projectInstance } = makeClient();
    await reorderRules(client, { spaceId: "s1", ruleIds: ["r2", "r1"] });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/spaces/s1/rules/reorder",
      { ruleIds: ["r2", "r1"] }
    );
  });
});

describe("js-sdk spaces (moderation/reports) — response mapping", () => {
  it("handleSpaceReport resolves to undefined on the 204 empty body", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.patch.mockResolvedValueOnce({ status: 204, data: "" });
    await expect(
      handleSpaceReport(client, { spaceId: "s1", reportId: "r1", actions: ["dismiss"], summary: "dismissed" }),
    ).resolves.toBeUndefined();
  });

  it("moderateSpaceEntity returns the ModerationResponse", async () => {
    const { client, projectInstance } = makeClient();
    const result = { message: "Entity moderated", moderationStatus: "removed" as const };
    projectInstance.patch.mockResolvedValueOnce({ data: result });

    const response = await moderateSpaceEntity(client, {
      spaceId: "s1",
      entityId: "e1",
      action: "remove",
    });

    expect(response).toEqual(result);
  });

  it("moderateSpaceComment returns the ModerationResponse", async () => {
    const { client, projectInstance } = makeClient();
    const result = { message: "Comment moderated", moderationStatus: "approved" as const };
    projectInstance.patch.mockResolvedValueOnce({ data: result });

    const response = await moderateSpaceComment(client, {
      spaceId: "s1",
      commentId: "c1",
      action: "approve",
    });

    expect(response).toEqual(result);
  });

  it("getSpaceConversation returns the Conversation", async () => {
    const { client, projectInstance } = makeClient();
    const conversation = { id: "conv1", spaceId: "s1" };
    projectInstance.get.mockResolvedValueOnce({ data: conversation });

    const response = await getSpaceConversation(client, { spaceId: "s1" });

    expect(response).toEqual(conversation);
  });

  it("moderateSpaceChatMessage returns the ModerateSpaceChatMessageResponse", async () => {
    const { client, projectInstance } = makeClient();
    const result = { message: "Message moderated", moderationStatus: "removed" as const };
    projectInstance.patch.mockResolvedValueOnce({ data: result });

    const response = await moderateSpaceChatMessage(client, {
      spaceId: "s1",
      messageId: "msg1",
      action: "remove",
    });

    expect(response).toEqual(result);
  });

  it("createRule returns the created Rule", async () => {
    const { client, projectInstance } = makeClient();
    const rule = { id: "r1", spaceId: "s1", title: "Be nice", description: null, order: 1, lastApprovedBy: null, createdAt: "now", updatedAt: "now" };
    projectInstance.post.mockResolvedValueOnce({ data: rule });

    const response = await createRule(client, { spaceId: "s1", title: "Be nice" });

    expect(response).toEqual(rule);
  });

  it("fetchRule returns the Rule", async () => {
    const { client, projectInstance } = makeClient();
    const rule = { id: "r1", title: "Be nice" };
    projectInstance.get.mockResolvedValueOnce({ data: rule });

    const response = await fetchRule(client, { spaceId: "s1", ruleId: "r1" });

    expect(response).toEqual(rule);
  });

  it("fetchManyRules returns the FetchManyRulesResponse", async () => {
    const { client, projectInstance } = makeClient();
    const result = { data: [{ id: "r1" }], count: 1 };
    projectInstance.get.mockResolvedValueOnce({ data: result });

    const response = await fetchManyRules(client, { spaceId: "s1" });

    expect(response).toEqual(result);
  });

  it("updateRule returns the updated Rule", async () => {
    const { client, projectInstance } = makeClient();
    const rule = { id: "r1", title: "Updated title" };
    projectInstance.patch.mockResolvedValueOnce({ data: rule });

    const response = await updateRule(client, {
      spaceId: "s1",
      ruleId: "r1",
      title: "Updated title",
    });

    expect(response).toEqual(rule);
  });

  it("deleteRule returns the DeleteRuleResponse", async () => {
    const { client, projectInstance } = makeClient();
    const result = {
      message: "Rule deleted",
      deletedRule: { id: "r1", title: "Be nice" },
    };
    projectInstance.delete.mockResolvedValueOnce({ data: result });

    const response = await deleteRule(client, { spaceId: "s1", ruleId: "r1" });

    expect(response).toEqual(result);
  });

  it("reorderRules returns the reordered Rule array", async () => {
    const { client, projectInstance } = makeClient();
    const rules = [{ id: "r2" }, { id: "r1" }];
    projectInstance.post.mockResolvedValueOnce({ data: rules });

    const response = await reorderRules(client, {
      spaceId: "s1",
      ruleIds: ["r2", "r1"],
    });

    expect(response).toEqual(rules);
  });
});
