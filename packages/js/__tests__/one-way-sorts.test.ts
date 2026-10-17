import type { FetchManyEntitiesProps } from "../src/modules/entities/fetchManyEntities";
import type { FetchManyCommentsProps } from "../src/modules/comments/fetchManyComments";
import type { FetchCommentsByUserIdProps } from "../src/modules/users/fetchCommentsByUserId";
import type { FetchCollectionEntitiesProps } from "../src/modules/collections/fetchCollectionEntities";

// `hot` and `controversial` rank one way only: the server refuses `sortDir`
// with them, and so do the request types (checked when this file compiles).
describe("one-way sorts", () => {
  it("allow sortDir with other sorts and refuse it with hot / controversial", () => {
    const ok: FetchManyEntitiesProps = { sortBy: "top", sortDir: "asc" };
    const okMeta: FetchManyEntitiesProps = { sortBy: "metadata.rank", sortDir: "desc" };
    const okHot: FetchManyEntitiesProps = { sortBy: "hot" };
    // @ts-expect-error — no sortDir with hot
    const badHot: FetchManyEntitiesProps = { sortBy: "hot", sortDir: "asc" };
    // @ts-expect-error — no sortDir with controversial
    const badControversial: FetchManyEntitiesProps = { sortBy: "controversial", sortDir: "desc" };
    // @ts-expect-error — sortBy is one of the server's sorts or metadata.*
    const badSortBy: FetchManyEntitiesProps = { sortBy: "score" };
    // @ts-expect-error — comments: no sortDir with controversial
    const badComments: FetchManyCommentsProps = { entityId: "e", sortBy: "controversial", sortDir: "asc" };
    // @ts-expect-error — a user's comment history: same
    const badHistory: FetchCommentsByUserIdProps = { userId: "u", sortBy: "controversial", sortDir: "asc" };
    // @ts-expect-error — collection entities: no sortDir with hot
    const badCollection: FetchCollectionEntitiesProps = { collectionId: "c", sortBy: "hot", sortDir: "asc" };
    const okCollection: FetchCollectionEntitiesProps = { collectionId: "c", sortBy: "addedAt", sortDir: "asc" };
    expect([ok, okMeta, okHot, badHot, badControversial, badSortBy, badComments, badHistory, badCollection, okCollection]).toHaveLength(10);
    // A comment sort held in state (no sortDir) is accepted.
    const pick = (sortBy: "createdAt" | "top" | "controversial") => {
      const thread: FetchManyCommentsProps = { entityId: "e", sortBy };
      const replies: FetchManyCommentsProps = { parentId: "p", sortBy };
      return [thread, replies];
    };
    expect(pick("controversial")).toHaveLength(2);
  });
});

// One of entityId (a thread) or parentId (replies, alone), never neither or
// both, alongside the one-way sort rule — checked when this file compiles.
describe("fetchManyComments ids", () => {
  it("takes entityId or parentId, with any sort, including one held in state", () => {
    const pick = (sortBy: "createdAt" | "top" | "controversial", isReply: boolean) => {
      const thread: FetchManyCommentsProps = { entityId: "e", sortBy };
      const replies: FetchManyCommentsProps = { parentId: "p", sortBy };
      const either: FetchManyCommentsProps = {
        ...(isReply ? { parentId: "p" } : { entityId: "e" }),
        sortBy,
      };
      return [thread, replies, either];
    };
    const threadDir: FetchManyCommentsProps = { entityId: "e", sortBy: "top", sortDir: "asc" };
    const repliesDir: FetchManyCommentsProps = { parentId: "p", sortDir: "asc" };
    // @ts-expect-error — neither id
    const neither: FetchManyCommentsProps = { sortBy: "createdAt" };
    // @ts-expect-error — not both: replies take parentId alone
    const both: FetchManyCommentsProps = { entityId: "e", parentId: "p" };
    // @ts-expect-error — replies: no sortDir with controversial
    const badReplies: FetchManyCommentsProps = { parentId: "p", sortBy: "controversial", sortDir: "asc" };
    expect([...pick("controversial", true), threadDir, repliesDir, neither, both, badReplies]).toHaveLength(8);
  });
});

import { fetchManyComments } from "../src/modules/comments/fetchManyComments";

describe("fetchManyComments request checks", () => {
  const makeClient = () => {
    const get = jest.fn().mockResolvedValue({ data: { data: [], pagination: { hasMore: false, nextCursor: null } } });
    return { client: { projectInstance: { get } } as never, get };
  };

  it("doesn't send replySortDir when the nested sort is controversial", async () => {
    const { client, get } = makeClient();
    await fetchManyComments(client, {
      entityId: "e",
      sortBy: "createdAt",
      replyDepth: 1,
      replySortBy: "controversial",
      replySortDir: "asc",
    });
    const params = get.mock.calls[0][1].params;
    expect(params).not.toHaveProperty("replySortDir");
    await fetchManyComments(client, { entityId: "e", replyDepth: 1, replySortDir: "asc" });
    expect(get.mock.calls[1][1].params).toMatchObject({ replySortDir: "asc" });
  });
});
