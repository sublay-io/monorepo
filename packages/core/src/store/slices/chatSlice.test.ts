import { describe, it, expect } from "vitest";

import reducer, {
  addOptimisticMessage,
  failOptimisticMessage,
  insertConversationPreview,
  mergeThreadReplies,
  patchMessage,
  removeConversationPreview,
  removeMessage,
  startThreadLoad,
  updateGrants,
  updateReactions,
  upsertMessage,
  type ChatState,
} from "./chatSlice";
import {
  makeChatMessage,
  makeConversationPreview,
  makeReputationGrant,
} from "../../test-utils";

function baseState(overrides: Partial<ChatState> = {}): ChatState {
  return {
    conversations: {},
    conversationList: {
      items: [],
      loading: false,
      hasMore: true,
      cursor: null,
    },
    messages: {},
    threads: {},
    typingUsers: {},
    socketConnected: false,
    totalUnreadCount: null,
    unreadConversationCount: null,
    ...overrides,
  };
}

describe("chatSlice — insertConversationPreview", () => {
  it("inserts an absent preview at the correct sorted position (lastMessageAt DESC)", () => {
    const older = makeConversationPreview({
      id: "older",
      lastMessageAt: "2024-01-01T00:00:00.000Z",
    });
    const newer = makeConversationPreview({
      id: "newer",
      lastMessageAt: "2024-01-03T00:00:00.000Z",
    });
    let state = baseState({
      conversationList: {
        items: [older],
        loading: false,
        hasMore: true,
        cursor: null,
      },
    });

    state = reducer(state, insertConversationPreview(newer));

    expect(state.conversationList.items.map((c) => c.id)).toEqual([
      "newer",
      "older",
    ]);
    // Mirrored into the per-conversation entry
    expect(state.conversations["newer"]?.data?.id).toBe("newer");
  });

  it("is idempotent when the preview is already present (patch, not duplicate)", () => {
    const existing = makeConversationPreview({
      id: "c1",
      lastMessageAt: "2024-01-01T00:00:00.000Z",
      unreadCount: 2,
    });
    let state = baseState({
      conversationList: {
        items: [existing],
        loading: false,
        hasMore: true,
        cursor: null,
      },
    });

    const patched = makeConversationPreview({
      id: "c1",
      lastMessageAt: "2024-01-05T00:00:00.000Z",
      unreadCount: 5,
    });
    state = reducer(state, insertConversationPreview(patched));

    expect(state.conversationList.items).toHaveLength(1);
    expect(state.conversationList.items[0].unreadCount).toBe(5);
    expect(state.conversationList.items[0].lastMessageAt).toBe(
      "2024-01-05T00:00:00.000Z"
    );
  });

  it("never mutates the global unread counters", () => {
    let state = baseState({
      totalUnreadCount: 3,
      unreadConversationCount: 1,
    });

    const preview = makeConversationPreview({ id: "c1", unreadCount: 7 });
    state = reducer(state, insertConversationPreview(preview));

    expect(state.totalUnreadCount).toBe(3);
    expect(state.unreadConversationCount).toBe(1);
  });
});

describe("chatSlice — removeConversationPreview", () => {
  it("removes a loaded preview with unread and decrements the globals (clamped)", () => {
    const preview = makeConversationPreview({ id: "c1", unreadCount: 2 });
    let state = baseState({
      conversationList: {
        items: [preview],
        loading: false,
        hasMore: true,
        cursor: null,
      },
      conversations: {
        c1: { data: preview, loading: false, error: null },
      },
      totalUnreadCount: 5,
      unreadConversationCount: 3,
    });

    state = reducer(state, removeConversationPreview("c1"));

    expect(state.conversationList.items).toHaveLength(0);
    expect(state.totalUnreadCount).toBe(3);
    expect(state.unreadConversationCount).toBe(2);
    // Cached detail bucket dropped
    expect(state.conversations["c1"]).toBeUndefined();
  });

  it("clamps the globals at 0 and never goes negative", () => {
    const preview = makeConversationPreview({ id: "c1", unreadCount: 10 });
    let state = baseState({
      conversationList: {
        items: [preview],
        loading: false,
        hasMore: true,
        cursor: null,
      },
      totalUnreadCount: 4,
      unreadConversationCount: 0,
    });

    state = reducer(state, removeConversationPreview("c1"));

    expect(state.totalUnreadCount).toBe(0);
    expect(state.unreadConversationCount).toBe(0);
  });

  it("does not touch the globals when the removed preview had no unread", () => {
    const preview = makeConversationPreview({ id: "c1", unreadCount: 0 });
    let state = baseState({
      conversationList: {
        items: [preview],
        loading: false,
        hasMore: true,
        cursor: null,
      },
      totalUnreadCount: 5,
      unreadConversationCount: 3,
    });

    state = reducer(state, removeConversationPreview("c1"));

    expect(state.conversationList.items).toHaveLength(0);
    expect(state.totalUnreadCount).toBe(5);
    expect(state.unreadConversationCount).toBe(3);
  });

  it("no-ops on the globals when the conversation is not loaded (leaves them to the summary refetch)", () => {
    let state = baseState({
      conversationList: {
        items: [makeConversationPreview({ id: "other", unreadCount: 1 })],
        loading: false,
        hasMore: true,
        cursor: null,
      },
      totalUnreadCount: 5,
      unreadConversationCount: 3,
    });

    state = reducer(state, removeConversationPreview("not-loaded"));

    expect(state.conversationList.items).toHaveLength(1);
    expect(state.totalUnreadCount).toBe(5);
    expect(state.unreadConversationCount).toBe(3);
  });
});

describe("chatSlice — updateGrants", () => {
  function stateWithMessage(messageId = "message-1", grants?: {
    total: number;
    count: number;
    viewerTotal: number;
  }) {
    return baseState({
      messages: {
        "conversation-1": {
          items: [makeChatMessage({ id: messageId, grants })],
          loading: false,
          hasMore: false,
          oldestMessageId: messageId,
          newestMessageId: messageId,
        },
      },
    });
  }

  it("writes the server's total/count onto the message", () => {
    let state = stateWithMessage();

    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "message-1",
        grant: makeReputationGrant({ senderId: "user-9", amount: 30 }),
        summary: { total: 30, count: 1 },
        currentUserId: "viewer-1",
      })
    );

    expect(state.messages["conversation-1"].items[0].grants).toEqual({
      total: 30,
      count: 1,
      // Somebody else's grant — the viewer's own total is untouched.
      viewerTotal: 0,
    });
  });

  it("derives viewerTotal locally when the viewer is the granter (the payload has none)", () => {
    let state = stateWithMessage("message-1", {
      total: 30,
      count: 1,
      viewerTotal: 5,
    });

    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "message-1",
        grant: makeReputationGrant({ senderId: "viewer-1", amount: 20 }),
        summary: { total: 50, count: 2 },
        currentUserId: "viewer-1",
      })
    );

    expect(state.messages["conversation-1"].items[0].grants).toEqual({
      total: 50,
      count: 2,
      viewerTotal: 25,
    });
  });

  it("leaves viewerTotal alone for an app mint (null senderId)", () => {
    let state = stateWithMessage("message-1", {
      total: 10,
      count: 1,
      viewerTotal: 10,
    });

    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "message-1",
        grant: makeReputationGrant({
          sourceType: "app",
          senderId: null,
          amount: 40,
        }),
        summary: { total: 50, count: 2 },
        currentUserId: "viewer-1",
      })
    );

    expect(state.messages["conversation-1"].items[0].grants).toEqual({
      total: 50,
      count: 2,
      viewerTotal: 10,
    });
  });

  it("stays coherent across the fetch→socket seam: server totals are absolute, viewerTotal accrues on the fetched baseline", () => {
    // Baseline as it arrives from an `includeGrants: true` page fetch: 100
    // total across 4 grants, 20 of which this viewer sent.
    let state = stateWithMessage("message-1", {
      total: 100,
      count: 4,
      viewerTotal: 20,
    });

    // Somebody else grants 30. total/count come straight from the server's
    // recompute; the viewer's own figure must not move.
    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "message-1",
        grant: makeReputationGrant({ senderId: "user-9", amount: 30 }),
        summary: { total: 130, count: 5 },
        currentUserId: "viewer-1",
      })
    );
    expect(state.messages["conversation-1"].items[0].grants).toEqual({
      total: 130,
      count: 5,
      viewerTotal: 20,
    });

    // Then the viewer grants 15 themselves.
    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "message-1",
        grant: makeReputationGrant({ senderId: "viewer-1", amount: 15 }),
        summary: { total: 145, count: 6 },
        currentUserId: "viewer-1",
      })
    );
    expect(state.messages["conversation-1"].items[0].grants).toEqual({
      total: 145,
      count: 6,
      // 20 from the fetch + 15 from this event — the two mechanisms compose
      // without double-counting, because only viewerTotal is incremental.
      viewerTotal: 35,
    });
  });

  it("seeds a summary from the event when the message was fetched without includeGrants", () => {
    // total/count are still exact (the server recomputes them per event);
    // viewerTotal starts from 0 because no baseline was ever loaded.
    let state = stateWithMessage("message-1");

    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "message-1",
        grant: makeReputationGrant({ senderId: "viewer-1", amount: 15 }),
        summary: { total: 145, count: 6 },
        currentUserId: "viewer-1",
      })
    );

    expect(state.messages["conversation-1"].items[0].grants).toEqual({
      total: 145,
      count: 6,
      viewerTotal: 15,
    });
  });

  it("no-ops when the conversation bucket is not loaded", () => {
    const state = baseState();

    const next = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "message-1",
        grant: makeReputationGrant(),
        summary: { total: 10, count: 1 },
        currentUserId: "viewer-1",
      })
    );

    expect(next.messages["conversation-1"]).toBeUndefined();
  });

  it("applies a grant that landed on a thread reply", () => {
    // Thread replies live in `threads[parentMessageId]`, never in the
    // conversation bucket: the server's message list filters
    // `parentMessageId: null`, so the two are disjoint on the fetch path.
    // `useLiveChatMessages` still passes `includeGrants` on the thread fetch,
    // which makes replies a grants-rendering surface — so the socket path has
    // to reach them too.
    let state = baseState({
      messages: {
        "conversation-1": {
          items: [makeChatMessage({ id: "parent-1" })],
          loading: false,
          hasMore: false,
          oldestMessageId: "parent-1",
          newestMessageId: "parent-1",
        },
      },
      threads: {
        "parent-1": {
          items: [
            makeChatMessage({ id: "reply-1" }),
            makeChatMessage({
              id: "reply-2",
              grants: { total: 10, count: 1, viewerTotal: 10 },
            }),
          ],
          loading: false,
          hasMore: false,
          cursor: null,
        },
      },
    });

    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "reply-2",
        grant: makeReputationGrant({ senderId: "viewer-1", amount: 25 }),
        summary: { total: 35, count: 2 },
        currentUserId: "viewer-1",
      })
    );

    expect(state.threads["parent-1"].items[1].grants).toEqual({
      total: 35,
      count: 2,
      // 10 from the fetched baseline + 25 the viewer just sent
      viewerTotal: 35,
    });
    // Untouched neighbours
    expect(state.threads["parent-1"].items[0].grants).toBeUndefined();
    expect(state.messages["conversation-1"].items[0].grants).toBeUndefined();
  });

  it("patches both copies when a reply is in the thread bucket AND the main stream", () => {
    // `message:created` is emitted for thread replies too, so a reply that
    // arrived live is appended to the conversation bucket as well. Both copies
    // are rendered, so both have to move.
    let state = baseState({
      messages: {
        "conversation-1": {
          items: [makeChatMessage({ id: "reply-1" })],
          loading: false,
          hasMore: false,
          oldestMessageId: "reply-1",
          newestMessageId: "reply-1",
        },
      },
      threads: {
        "parent-1": {
          items: [makeChatMessage({ id: "reply-1" })],
          loading: false,
          hasMore: false,
          cursor: null,
        },
      },
    });

    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "reply-1",
        grant: makeReputationGrant({ senderId: "user-9", amount: 12 }),
        summary: { total: 12, count: 1 },
        currentUserId: "viewer-1",
      })
    );

    const expected = { total: 12, count: 1, viewerTotal: 0 };
    expect(state.messages["conversation-1"].items[0].grants).toEqual(expected);
    expect(state.threads["parent-1"].items[0].grants).toEqual(expected);
  });

  it("applies a thread-reply grant even when the conversation bucket was never created", () => {
    let state = baseState({
      threads: {
        "parent-1": {
          items: [makeChatMessage({ id: "reply-1" })],
          loading: false,
          hasMore: false,
          cursor: null,
        },
      },
    });

    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "reply-1",
        grant: makeReputationGrant({ senderId: "user-9", amount: 7 }),
        summary: { total: 7, count: 1 },
        currentUserId: "viewer-1",
      })
    );

    expect(state.threads["parent-1"].items[0].grants).toEqual({
      total: 7,
      count: 1,
      viewerTotal: 0,
    });
    // No bucket is invented for the conversation.
    expect(state.messages["conversation-1"]).toBeUndefined();
  });

  it("no-ops when the message is loaded in neither bucket", () => {
    let state = baseState({
      threads: {
        "parent-1": {
          items: [makeChatMessage({ id: "reply-1" })],
          loading: false,
          hasMore: false,
          cursor: null,
        },
      },
    });

    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "message-absent",
        grant: makeReputationGrant(),
        summary: { total: 10, count: 1 },
        currentUserId: "viewer-1",
      })
    );

    expect(state.threads["parent-1"].items[0].grants).toBeUndefined();
    expect(state.messages["conversation-1"]).toBeUndefined();
  });

  it("no-ops when the message is not loaded", () => {
    let state = stateWithMessage("message-1");

    state = reducer(
      state,
      updateGrants({
        conversationId: "conversation-1",
        messageId: "message-absent",
        grant: makeReputationGrant(),
        summary: { total: 10, count: 1 },
        currentUserId: "viewer-1",
      })
    );

    expect(state.messages["conversation-1"].items[0].grants).toBeUndefined();
  });
});

describe("chatSlice — thread replies", () => {
  const CONV = "conversation-1";

  function parent() {
    return makeChatMessage({
      id: "parent-1",
      conversationId: CONV,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
  }

  function reply(id: string, createdAt: string, extra: Record<string, unknown> = {}) {
    return makeChatMessage({
      id,
      conversationId: CONV,
      parentMessageId: "parent-1",
      createdAt,
      ...extra,
    });
  }

  // The main stream holds the parent; the thread is open with one reply.
  function openThread(hasMore = false, socketConnected = true) {
    return baseState({
      socketConnected,
      messages: {
        [CONV]: {
          items: [parent()],
          loading: false,
          hasMore: false,
          oldestMessageId: "parent-1",
          newestMessageId: "parent-1",
        },
      },
      threads: {
        "parent-1": {
          items: [reply("reply-1", "2024-01-01T00:00:01.000Z")],
          loading: false,
          hasMore,
          cursor: "2024-01-01T00:00:01.000Z",
        },
      },
    });
  }

  it("upsertMessage puts a reply in its open thread, never in the main stream", () => {
    const state = reducer(openThread(), upsertMessage(reply("reply-2", "2024-01-01T00:00:02.000Z")));

    expect(state.threads["parent-1"].items.map((m) => m.id)).toEqual(["reply-1", "reply-2"]);
    expect(state.messages[CONV].items.map((m) => m.id)).toEqual(["parent-1"]);
    expect(state.messages[CONV].newestMessageId).toBe("parent-1");
  });

  it("upsertMessage drops a reply whose thread isn't loaded", () => {
    const start = baseState({
      messages: {
        [CONV]: {
          items: [parent()],
          loading: false,
          hasMore: false,
          oldestMessageId: "parent-1",
          newestMessageId: "parent-1",
        },
      },
    });
    const state = reducer(start, upsertMessage(reply("reply-1", "2024-01-01T00:00:01.000Z")));

    expect(state.messages[CONV].items.map((m) => m.id)).toEqual(["parent-1"]);
    expect(state.threads).toEqual({});
  });

  it("a live reply advances the cursor when the thread is loaded to its end", () => {
    const state = reducer(openThread(false), upsertMessage(reply("reply-2", "2024-01-01T00:00:02.000Z")));
    expect(state.threads["parent-1"].cursor).toBe("2024-01-01T00:00:02.000Z");
  });

  it("a reply confirmed while the socket is down leaves the cursor, so catch-up covers what was missed", () => {
    const state = reducer(
      openThread(false, false),
      upsertMessage(reply("reply-6", "2024-01-01T00:00:06.000Z")),
    );

    expect(state.threads["parent-1"].items.map((m) => m.id)).toEqual(["reply-1", "reply-6"]);
    expect(state.threads["parent-1"].cursor).toBe("2024-01-01T00:00:01.000Z");
  });

  it("confirming a send or an edit keeps the reactions the server response leaves out", () => {
    let state = reducer(
      openThread(),
      addOptimisticMessage(reply("temp-abc", "2024-01-01T00:00:05.000Z", { localId: "abc" })),
    );
    // Server-shaped: the send response has no reactionCounts / userReactions.
    const confirmed = reply("reply-2", "2024-01-01T00:00:05.000Z", { localId: "abc" }) as unknown as Record<string, unknown>;
    delete confirmed.reactionCounts;
    delete confirmed.userReactions;
    state = reducer(state, upsertMessage(confirmed as never));

    // Reacting to your own fresh reply works.
    state = reducer(
      state,
      updateReactions({
        conversationId: CONV,
        messageId: "reply-2",
        reactionCounts: { "👍": 1 },
        userId: "user-1",
        emoji: "👍",
        delta: 1,
        currentUserId: "user-1",
      }),
    );
    expect(state.threads["parent-1"].items[1].userReactions).toEqual(["👍"]);

    // An edit response (also without reaction fields) keeps them.
    const edited = { ...confirmed, content: "edited" };
    state = reducer(state, upsertMessage(edited as never));
    expect(state.threads["parent-1"].items[1].content).toBe("edited");
    expect(state.threads["parent-1"].items[1].reactionCounts).toEqual({ "👍": 1 });
    expect(state.threads["parent-1"].items[1].userReactions).toEqual(["👍"]);
  });

  it("a send marked failed that the server delivered anyway is no longer failed", () => {
    let state = reducer(
      openThread(),
      addOptimisticMessage(reply("temp-abc", "2024-01-01T00:00:05.000Z", { localId: "abc" })),
    );
    state = reducer(state, failOptimisticMessage({ conversationId: CONV, localId: "abc" }));
    expect(state.threads["parent-1"].items[1].sendFailed).toBe(true);

    // The message:created echo arrives with the same localId.
    state = reducer(state, upsertMessage(reply("reply-2", "2024-01-01T00:00:05.000Z", { localId: "abc" })));
    expect(state.threads["parent-1"].items[1].id).toBe("reply-2");
    expect(state.threads["parent-1"].items[1].sendFailed).toBeUndefined();
  });

  it("a message inserted without reaction fields starts with none", () => {
    const incoming = reply("reply-2", "2024-01-01T00:00:02.000Z") as unknown as Record<string, unknown>;
    delete incoming.reactionCounts;
    delete incoming.userReactions;
    const state = reducer(openThread(), upsertMessage(incoming as never));

    expect(state.threads["parent-1"].items[1].reactionCounts).toEqual({});
    expect(state.threads["parent-1"].items[1].userReactions).toEqual([]);
  });

  it("a live reply beyond unloaded replies leaves the cursor where the fetched run ends", () => {
    const state = reducer(openThread(true), upsertMessage(reply("reply-9", "2024-01-01T00:00:09.000Z")));

    expect(state.threads["parent-1"].items.map((m) => m.id)).toEqual(["reply-1", "reply-9"]);
    expect(state.threads["parent-1"].cursor).toBe("2024-01-01T00:00:01.000Z");
  });

  it("mergeThreadReplies merges a page in order, keeping live replies, and moves the cursor", () => {
    let state = reducer(openThread(true), upsertMessage(reply("reply-9", "2024-01-01T00:00:09.000Z")));
    state = reducer(
      state,
      mergeThreadReplies({
        parentMessageId: "parent-1",
        messages: [reply("reply-2", "2024-01-01T00:00:02.000Z"), reply("reply-3", "2024-01-01T00:00:03.000Z")],
        hasMore: false,
      }),
    );

    expect(state.threads["parent-1"].items.map((m) => m.id)).toEqual([
      "reply-1",
      "reply-2",
      "reply-3",
      "reply-9",
    ]);
    expect(state.threads["parent-1"].cursor).toBe("2024-01-01T00:00:03.000Z");
    expect(state.threads["parent-1"].hasMore).toBe(false);
  });

  it("reopening a kept thread takes the cursor from its first page, not a cursor that jumped a gap", () => {
    // Read to the end, closed; replies 2–8 were missed while closed, then
    // reply-9 arrived live and moved the cursor past them.
    let state = reducer(openThread(false), upsertMessage(reply("reply-9", "2024-01-01T00:00:09.000Z")));
    expect(state.threads["parent-1"].cursor).toBe("2024-01-01T00:00:09.000Z");

    // Reopened: the load starts by forgetting the fetched run…
    state = reducer(state, startThreadLoad({ parentMessageId: "parent-1" }));
    expect(state.threads["parent-1"].cursor).toBeNull();
    expect(state.threads["parent-1"].hasMore).toBe(true);
    expect(state.threads["parent-1"].items.map((m) => m.id)).toEqual(["reply-1", "reply-9"]);

    // …then the first page from the start, with more to come.
    state = reducer(
      state,
      mergeThreadReplies({
        parentMessageId: "parent-1",
        messages: [reply("reply-1", "2024-01-01T00:00:01.000Z"), reply("reply-2", "2024-01-01T00:00:02.000Z")],
        hasMore: true,
      }),
    );

    expect(state.threads["parent-1"].cursor).toBe("2024-01-01T00:00:02.000Z");
    expect(state.threads["parent-1"].hasMore).toBe(true);
    expect(state.threads["parent-1"].items.map((m) => m.id)).toEqual(["reply-1", "reply-2", "reply-9"]);
  });

  it("an optimistic reply goes to its thread, and a failed one is flagged there", () => {
    const optimistic = reply("temp-abc", "2024-01-01T00:00:05.000Z", { localId: "abc" });
    let state = reducer(openThread(), addOptimisticMessage(optimistic));

    expect(state.threads["parent-1"].items.map((m) => m.id)).toEqual(["reply-1", "temp-abc"]);
    expect(state.messages[CONV].items.map((m) => m.id)).toEqual(["parent-1"]);
    // Optimistic replies don't move the cursor
    expect(state.threads["parent-1"].cursor).toBe("2024-01-01T00:00:01.000Z");

    state = reducer(state, failOptimisticMessage({ conversationId: CONV, localId: "abc" }));
    expect(state.threads["parent-1"].items[1].sendFailed).toBe(true);
  });

  it("the confirmed reply replaces its optimistic copy in the thread", () => {
    let state = reducer(
      openThread(),
      addOptimisticMessage(reply("temp-abc", "2024-01-01T00:00:05.000Z", { localId: "abc" })),
    );
    state = reducer(state, upsertMessage(reply("reply-2", "2024-01-01T00:00:05.000Z", { localId: "abc" })));

    expect(state.threads["parent-1"].items.map((m) => m.id)).toEqual(["reply-1", "reply-2"]);
  });

  it("patchMessage, updateReactions and removeMessage reach a thread reply", () => {
    let state = reducer(
      openThread(),
      patchMessage({ conversationId: CONV, messageId: "reply-1", patch: { content: "edited" } }),
    );
    expect(state.threads["parent-1"].items[0].content).toBe("edited");

    state = reducer(
      state,
      updateReactions({
        conversationId: CONV,
        messageId: "reply-1",
        reactionCounts: { "👍": 1 },
        userId: "user-1",
        emoji: "👍",
        delta: 1,
        currentUserId: "user-1",
      }),
    );
    expect(state.threads["parent-1"].items[0].reactionCounts).toEqual({ "👍": 1 });
    expect(state.threads["parent-1"].items[0].userReactions).toEqual(["👍"]);

    state = reducer(state, removeMessage({ conversationId: CONV, messageId: "reply-1" }));
    expect(state.threads["parent-1"].items[0].userDeletedAt).not.toBeNull();
    expect(state.threads["parent-1"].items[0].content).toBeNull();
  });

  it("patchMessage reaches a thread reply when the payload has no conversationId", () => {
    const state = reducer(
      openThread(),
      patchMessage({ messageId: "reply-1", patch: { moderationStatus: "removed" } }),
    );
    expect(state.threads["parent-1"].items[0].moderationStatus).toBe("removed");
  });
});
