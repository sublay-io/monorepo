import {
  addReaction,
  createComment,
  deleteComment,
  fetchComment,
  fetchCommentByForeignId,
  fetchManyComments,
  fetchReactions,
  getUserReaction,
  removeReaction,
  updateComment,
} from "../src/modules/comments";
import { makeClient } from "./helpers/client";

describe("js-sdk comments — request shaping", () => {
  it("createComment posts the full body to /comments", async () => {
    const { client, projectInstance } = makeClient();
    const data = {
      entityId: "e1",
      content: "hello",
      parentId: null,
      mentions: [],
    };
    await createComment(client, data);
    expect(projectInstance.post).toHaveBeenCalledWith("/comments", data);
  });

  it("fetchComment gets /comments/:commentId with the rest as params (no userId)", async () => {
    const { client, projectInstance } = makeClient();
    await fetchComment(client, {
      commentId: "c1",
      include: "user",
      spaceReputationId: "none",
    });
    expect(projectInstance.get).toHaveBeenCalledWith("/comments/c1", {
      params: { include: "user", spaceReputationId: "none" },
    });
    const [, config] = projectInstance.get.mock.calls[0];
    expect(config.params).not.toHaveProperty("userId");
  });

  it("fetchCommentByForeignId gets /comments/by-foreign-id with the full data as params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchCommentByForeignId(client, {
      foreignId: "f1",
      include: "entity",
    });
    expect(projectInstance.get).toHaveBeenCalledWith("/comments/by-foreign-id", {
      params: { foreignId: "f1", include: "entity" },
    });
  });

  it("fetchCommentByForeignId flattens the space-reputation options into the query", async () => {
    const { client, projectInstance } = makeClient();
    await fetchCommentByForeignId(client, {
      foreignId: "f1",
      spaceReputation: { spaceId: "s1", includeDescendants: true },
    });
    expect(projectInstance.get).toHaveBeenCalledWith("/comments/by-foreign-id", {
      params: {
        foreignId: "f1",
        spaceReputationId: "s1",
        spaceReputationDescendants: true,
      },
    });
  });

  it("updateComment patches /comments/:commentId with the rest of the body", async () => {
    const { client, projectInstance } = makeClient();
    await updateComment(client, { commentId: "c1", content: "edited" });
    expect(projectInstance.patch).toHaveBeenCalledWith("/comments/c1", {
      content: "edited",
    });
  });

  it("updateComment forwards metadata, with or without content", async () => {
    const { client, projectInstance } = makeClient();

    await updateComment(client, {
      commentId: "c1",
      content: "edited",
      metadata: { revision: 2 },
    });
    expect(projectInstance.patch).toHaveBeenCalledWith("/comments/c1", {
      content: "edited",
      metadata: { revision: 2 },
    });

    // Metadata-only edits are valid server-side; content must not be injected.
    await updateComment(client, { commentId: "c1", metadata: { pinned: true } });
    expect(projectInstance.patch).toHaveBeenLastCalledWith("/comments/c1", {
      metadata: { pinned: true },
    });
  });

  it("deleteComment deletes /comments/:commentId with no body/params", async () => {
    const { client, projectInstance } = makeClient();
    await deleteComment(client, { commentId: "c1" });
    expect(projectInstance.delete).toHaveBeenCalledWith("/comments/c1");
  });

  it("fetchManyComments sends only thread params, with cursor and nesting", async () => {
    const { client, projectInstance } = makeClient();
    await fetchManyComments(client, {
      entityId: "e1",
      cursor: "abc",
      limit: 20,
      sortBy: "top",
      sortDir: "asc",
      sortByReaction: "love",
      replyDepth: 2,
      replyLimit: 3,
      replySortBy: "createdAt",
      replySortDir: "desc",
      replySortByReaction: "like",
      include: ["user", "grants"],
      spaceReputationId: "none",
    });
    expect(projectInstance.get).toHaveBeenCalledWith("/comments", {
      params: {
        entityId: "e1",
        cursor: "abc",
        limit: 20,
        sortBy: "top",
        sortDir: "asc",
        sortByReaction: "love",
        replyDepth: 2,
        replyLimit: 3,
        replySortBy: "createdAt",
        replySortDir: "desc",
        replySortByReaction: "like",
        include: "user,grants",
        spaceReputationId: "none",
      },
    });
  });

  it("fetchManyComments never forwards params the thread endpoint rejects", async () => {
    const { client, projectInstance } = makeClient();
    await fetchManyComments(client, {
      parentId: "c0",
      page: 2,
      userId: "u1",
      sourceId: "s1",
      blockedFilter: "exclude",
    } as any);
    expect(projectInstance.get).toHaveBeenCalledWith("/comments", {
      params: { parentId: "c0" },
    });
  });

  it("addReaction posts only reactionType to /comments/:commentId/reactions (no userId)", async () => {
    const { client, projectInstance } = makeClient();
    await addReaction(client, { commentId: "c1", reactionType: "upvote" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/comments/c1/reactions",
      { reactionType: "upvote" }
    );
  });

  it("removeReaction deletes /comments/:commentId/reactions with no body/params", async () => {
    const { client, projectInstance } = makeClient();
    await removeReaction(client, { commentId: "c1" });
    expect(projectInstance.delete).toHaveBeenCalledWith(
      "/comments/c1/reactions"
    );
  });

  it("fetchReactions gets /comments/:commentId/reactions with the rest as params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchReactions(client, {
      commentId: "c1",
      reactionType: "love",
      page: 2,
      limit: 10,
      sortDir: "desc",
    });
    expect(projectInstance.get).toHaveBeenCalledWith(
      "/comments/c1/reactions",
      { params: { reactionType: "love", page: 2, limit: 10, sortDir: "desc" } }
    );
  });

  it("getUserReaction gets /comments/:commentId/reactions/me with no params (actor derived from token)", async () => {
    const { client, projectInstance } = makeClient();
    await getUserReaction(client, { commentId: "c1" });
    expect(projectInstance.get).toHaveBeenCalledWith(
      "/comments/c1/reactions/me"
    );
  });
});

describe("js-sdk comments — response mapping", () => {
  it("createComment returns the created Comment", async () => {
    const { client, projectInstance } = makeClient();
    const comment = { id: "c1", content: "hello" };
    projectInstance.post.mockResolvedValueOnce({ data: comment });

    const result = await createComment(client, {
      entityId: "e1",
      content: "hello",
    });

    expect(result).toEqual(comment);
  });

  it("fetchComment returns the Comment", async () => {
    const { client, projectInstance } = makeClient();
    const comment = { id: "c1", content: "hi" };
    // v8 returns the record bare.
    projectInstance.get.mockResolvedValueOnce({ data: comment });

    const result = await fetchComment(client, { commentId: "c1" });

    expect(result).toEqual(comment);
  });

  it("fetchCommentByForeignId returns the Comment", async () => {
    const { client, projectInstance } = makeClient();
    const comment = { id: "c1", foreignId: "f1" };
    projectInstance.get.mockResolvedValueOnce({ data: comment });

    const result = await fetchCommentByForeignId(client, { foreignId: "f1" });

    expect(result).toEqual(comment);
  });

  it("updateComment returns the updated Comment", async () => {
    const { client, projectInstance } = makeClient();
    const comment = { id: "c1", content: "edited" };
    projectInstance.patch.mockResolvedValueOnce({ data: comment });

    const result = await updateComment(client, {
      commentId: "c1",
      content: "edited",
    });

    expect(result).toEqual(comment);
  });

  it("deleteComment resolves to undefined (void)", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.delete.mockResolvedValueOnce({ data: undefined });

    const result = await deleteComment(client, { commentId: "c1" });

    expect(result).toBeUndefined();
  });

  it("fetchManyComments returns the cursor envelope (nested replies included)", async () => {
    const { client, projectInstance } = makeClient();
    const envelope = {
      data: [
        {
          id: "c1",
          isAuthorBlocked: false,
          isUnavailable: false,
          replies: { data: [{ id: "r1" }], pagination: { nextCursor: "n", hasMore: true } },
        },
      ],
      pagination: { nextCursor: null, hasMore: false },
    };
    projectInstance.get.mockResolvedValueOnce({ data: envelope });
    await expect(fetchManyComments(client, { entityId: "e1" })).resolves.toEqual(envelope);
  });

  it("addReaction returns the full populated Comment", async () => {
    const { client, projectInstance } = makeClient();
    const comment = {
      id: "c1",
      reactionCounts: { upvote: 1, downvote: 0 },
      userReaction: "upvote",
    };
    projectInstance.post.mockResolvedValueOnce({ data: comment });

    const result = await addReaction(client, {
      commentId: "c1",
      reactionType: "upvote",
    });

    expect(result).toEqual(comment);
  });

  it("removeReaction returns the full populated Comment", async () => {
    const { client, projectInstance } = makeClient();
    const comment = {
      id: "c1",
      reactionCounts: { upvote: 0, downvote: 0 },
      userReaction: null,
    };
    projectInstance.delete.mockResolvedValueOnce({ data: comment });

    const result = await removeReaction(client, { commentId: "c1" });

    expect(result).toEqual(comment);
  });

  it("fetchReactions returns the reactions envelope", async () => {
    const { client, projectInstance } = makeClient();
    const envelope = {
      data: [{ id: "r1", reactionType: "upvote", userId: "u1" }],
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 1,
        hasMore: false,
      },
    };
    projectInstance.get.mockResolvedValueOnce({ data: envelope });

    const result = await fetchReactions(client, { commentId: "c1" });

    expect(result).toEqual(envelope);
  });

  it("getUserReaction returns the reactionType wrapper", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.get.mockResolvedValueOnce({
      data: { reactionType: "love" },
    });

    const result = await getUserReaction(client, { commentId: "c1" });

    expect(result).toEqual({ reactionType: "love" });
  });
});

describe("js-sdk comments — cursor accepts `pagination.nextCursor` as returned", () => {
  it("fetchManyComments takes a `string | null` cursor and omits null", async () => {
    const { client, projectInstance } = makeClient();
    // What a paging loop holds: the previous response's `nextCursor`.
    const nextCursor: string | null = null as string | null;
    await fetchManyComments(client, { entityId: "e1", cursor: nextCursor });
    expect(projectInstance.get).toHaveBeenCalledWith("/comments", {
      params: { entityId: "e1" },
    });

    const later: string | null = "abc" as string | null;
    await fetchManyComments(client, { entityId: "e1", cursor: later });
    expect(projectInstance.get).toHaveBeenLastCalledWith("/comments", {
      params: { entityId: "e1", cursor: "abc" },
    });
  });
});
