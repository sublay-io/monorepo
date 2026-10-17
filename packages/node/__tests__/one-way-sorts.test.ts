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
    const badCollection: FetchCollectionEntitiesProps = { collectionId: "c", userId: "u", sortBy: "hot", sortDir: "asc" };
    const okCollection: FetchCollectionEntitiesProps = { collectionId: "c", userId: "u", sortBy: "addedAt", sortDir: "asc" };
    expect([ok, okMeta, okHot, badHot, badControversial, badSortBy, badComments, badHistory, badCollection, okCollection]).toHaveLength(10);
  });
});
