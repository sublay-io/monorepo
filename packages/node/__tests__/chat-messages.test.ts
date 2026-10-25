import {
  deleteMessage,
  editMessage,
  getMessage,
  listMessages,
  listReactions,
  markAsRead,
  sendMessage,
  toggleReaction,
} from "../src/modules/chat";
import { makeClient } from "./helpers/mockClient";

describe("node-sdk chat (messages) — request shaping", () => {
  it("listMessages strips conversationId into the path and passes the rest as params (before/after cursor pagination)", async () => {
    const { client, projectInstance } = makeClient();
    await listMessages(client, { conversationId: "conv1", actingUserId: "u1", before: "t1", limit: 20 });
    expect(projectInstance.get).toHaveBeenCalledWith(
      "/chat/conversations/conv1/messages",
      { params: { actingUserId: "u1", before: "t1", limit: 20 } },
    );
  });

  it("sendMessage sends a plain JSON body when there are no files", async () => {
    const { client, projectInstance } = makeClient();
    await sendMessage(client, { conversationId: "conv1", actingUserId: "u1", content: "hi" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/chat/conversations/conv1/messages",
      { actingUserId: "u1", content: "hi" },
    );
    expect(projectInstance.post.mock.calls[0]).toHaveLength(2);
  });

  it("sendMessage sends multipart FormData when files are attached", async () => {
    const { client, projectInstance } = makeClient();
    await sendMessage(client, {
      conversationId: "conv1",
      actingUserId: "u1",
      content: "see attached",
      files: [{ file: new Uint8Array([1, 2, 3]), filename: "photo.png", mimeType: "image/png" }],
    });

    expect(projectInstance.post).toHaveBeenCalledTimes(1);
    const [path, formData, config] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/chat/conversations/conv1/messages");
    expect(formData).toBeInstanceOf(FormData);
    expect(config).toBeUndefined();

    const fd = formData as FormData;
    expect(fd.get("actingUserId")).toBe("u1");
    expect(fd.get("content")).toBe("see attached");
    expect(fd.get("files")).toBeInstanceOf(Blob);
    expect((fd.get("files") as File).name).toBe("photo.png");
  });

  it("sendMessage sends the spaceReputation options in the JSON body, never the query", async () => {
    const { client, projectInstance } = makeClient();
    await sendMessage(client, {
      conversationId: "conv1",
      actingUserId: "u1",
      content: "hi",
      spaceReputationId: "rep1",
      spaceReputationDescendants: true,
    });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/chat/conversations/conv1/messages",
      {
        actingUserId: "u1",
        content: "hi",
        spaceReputationId: "rep1",
        spaceReputationDescendants: true,
      },
    );
    expect(projectInstance.post.mock.calls[0]).toHaveLength(2);
  });

  it("sendMessage sends the spaceReputation options as form fields on a multipart send", async () => {
    const { client, projectInstance } = makeClient();
    await sendMessage(client, {
      conversationId: "conv1",
      actingUserId: "u1",
      spaceReputation: { spaceId: "rep1", includeDescendants: false },
      files: [{ file: new Uint8Array([1]), filename: "a.png", mimeType: "image/png" }],
    });
    const [, formData, config] = projectInstance.post.mock.calls[0];
    expect(config).toBeUndefined();
    const fd = formData as FormData;
    expect(fd.get("spaceReputationId")).toBe("rep1");
    expect(fd.get("spaceReputationDescendants")).toBe("false");
  });

  it("getMessage strips conversationId/messageId into the path and passes the rest as params", async () => {
    const { client, projectInstance } = makeClient();
    await getMessage(client, { conversationId: "conv1", messageId: "msg1", actingUserId: "u1" });
    expect(projectInstance.get).toHaveBeenCalledWith(
      "/chat/conversations/conv1/messages/msg1",
      { params: { actingUserId: "u1" } },
    );
  });

  it("editMessage strips conversationId/messageId into the path and patches the rest", async () => {
    const { client, projectInstance } = makeClient();
    await editMessage(client, { conversationId: "conv1", messageId: "msg1", actingUserId: "u1", content: "edited" });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/chat/conversations/conv1/messages/msg1",
      { actingUserId: "u1", content: "edited" },
    );
  });

  it("deleteMessage sends actingUserId as a param", async () => {
    const { client, projectInstance } = makeClient();
    await deleteMessage(client, { conversationId: "conv1", messageId: "msg1", actingUserId: "u1" });
    expect(projectInstance.delete).toHaveBeenCalledWith(
      "/chat/conversations/conv1/messages/msg1",
      { params: { actingUserId: "u1" } },
    );
  });

  it("toggleReaction posts emoji + actingUserId to the reactions route", async () => {
    const { client, projectInstance } = makeClient();
    await toggleReaction(client, { conversationId: "conv1", messageId: "msg1", emoji: "👍", actingUserId: "u1" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/chat/conversations/conv1/messages/msg1/reactions",
      { emoji: "👍", actingUserId: "u1" },
    );
  });

  it("listReactions strips conversationId/messageId into the path and passes the rest as params", async () => {
    const { client, projectInstance } = makeClient();
    await listReactions(client, { conversationId: "conv1", messageId: "msg1", emoji: "👍", actingUserId: "u1" });
    expect(projectInstance.get).toHaveBeenCalledWith(
      "/chat/conversations/conv1/messages/msg1/reactions",
      { params: { emoji: "👍", actingUserId: "u1" } },
    );
  });

  it("markAsRead posts messageId + actingUserId to the read route", async () => {
    const { client, projectInstance } = makeClient();
    await markAsRead(client, { conversationId: "conv1", messageId: "msg1", actingUserId: "u1" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/chat/conversations/conv1/read",
      { messageId: "msg1", actingUserId: "u1" },
    );
  });
});

describe("node-sdk chat (messages) — response mapping", () => {
  it("listMessages returns the raw { messages, hasMore, ... } shape, not a PaginatedResponse envelope", async () => {
    const { client, projectInstance } = makeClient();
    const result = {
      messages: [{ id: "msg1" }],
      hasMore: false,
      oldestCreatedAt: "t0",
      newestCreatedAt: "t1",
    };
    projectInstance.get.mockResolvedValueOnce({ data: result });
    await expect(
      listMessages(client, { conversationId: "conv1", actingUserId: "u1" }),
    ).resolves.toEqual(result);
  });

  it("sendMessage (JSON path) returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const message = { id: "msg1", content: "hi" };
    projectInstance.post.mockResolvedValueOnce({ data: message });
    await expect(
      sendMessage(client, { conversationId: "conv1", actingUserId: "u1", content: "hi" }),
    ).resolves.toEqual(message);
  });

  it("sendMessage (multipart path) returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const message = { id: "msg2", content: "see attached" };
    projectInstance.post.mockResolvedValueOnce({ data: message });
    await expect(
      sendMessage(client, {
        conversationId: "conv1",
        actingUserId: "u1",
        content: "see attached",
        files: [{ file: new Uint8Array([1]) }],
      }),
    ).resolves.toEqual(message);
  });

  it("getMessage returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const message = { id: "msg1" };
    projectInstance.get.mockResolvedValueOnce({ data: message });
    await expect(
      getMessage(client, { conversationId: "conv1", messageId: "msg1", actingUserId: "u1" }),
    ).resolves.toEqual(message);
  });

  it("editMessage returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const message = { id: "msg1", content: "edited" };
    projectInstance.patch.mockResolvedValueOnce({ data: message });
    await expect(
      editMessage(client, { conversationId: "conv1", messageId: "msg1", actingUserId: "u1", content: "edited" }),
    ).resolves.toEqual(message);
  });

  it("deleteMessage resolves to undefined", async () => {
    const { client } = makeClient();
    await expect(
      deleteMessage(client, { conversationId: "conv1", messageId: "msg1", actingUserId: "u1" }),
    ).resolves.toBeUndefined();
  });

  it("toggleReaction returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { reactionCounts: { "👍": 1 }, userReactions: ["👍"], delta: 1 as const };
    projectInstance.post.mockResolvedValueOnce({ data: result });
    await expect(
      toggleReaction(client, { conversationId: "conv1", messageId: "msg1", emoji: "👍", actingUserId: "u1" }),
    ).resolves.toEqual(result);
  });

  it("listReactions returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { data: [{ emoji: "👍", user: { id: "u2" } }], pagination: { page: 1, limit: 10, total: 1 } };
    projectInstance.get.mockResolvedValueOnce({ data: result });
    await expect(
      listReactions(client, { conversationId: "conv1", messageId: "msg1", emoji: "👍", actingUserId: "u1" }),
    ).resolves.toEqual(result);
  });

  it("markAsRead resolves to undefined", async () => {
    const { client } = makeClient();
    await expect(
      markAsRead(client, { conversationId: "conv1", messageId: "msg1", actingUserId: "u1" }),
    ).resolves.toBeUndefined();
  });
});
