import { askContent, matchUsers, searchContent, searchSpaces, searchUsers } from "../src/modules/search";
import type { MatchUsersResponse } from "../src/modules/search/matchUsers";
import { Readable } from "node:stream";
import { AxiosError, AxiosHeaders } from "axios";
import { makeClient } from "./helpers/mockClient";

// A response body stream yielding each string as one chunk.
function sseStream(chunks: string[]): Readable {
  return Readable.from(chunks.map((c) => Buffer.from(c)));
}

async function collect<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const ev of gen) out.push(ev);
  return out;
}

describe("node-sdk search — request shaping", () => {
  it("searchContent posts everything in the body, the space-reputation options too", async () => {
    const { client, projectInstance } = makeClient();
    await searchContent(client, {
      query: "hello",
      sourceTypes: ["entity"],
      spaceReputation: { spaceId: "rep1", includeDescendants: true },
    });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/search/content",
      {
        query: "hello",
        sourceTypes: ["entity"],
        spaceReputationId: "rep1",
        spaceReputationDescendants: true,
      },
    );
    expect(projectInstance.post.mock.calls[0]).toHaveLength(2);
  });

  it("searchUsers posts the full body to /search/users", async () => {
    const { client, projectInstance } = makeClient();
    await searchUsers(client, { query: "ali", limit: 5 });
    expect(projectInstance.post).toHaveBeenCalledWith("/search/users", {
      query: "ali",
      limit: 5,
    });
  });

  it("searchUsers forwards an optional actingUserId in the body", async () => {
    const { client, projectInstance } = makeClient();
    await searchUsers(client, { query: "ali", actingUserId: "viewer1" });
    expect(projectInstance.post).toHaveBeenCalledWith("/search/users", {
      query: "ali",
      actingUserId: "viewer1",
    });
  });

  it("searchSpaces posts the full body to /search/spaces", async () => {
    const { client, projectInstance } = makeClient();
    await searchSpaces(client, { query: "design", limit: 5 });
    expect(projectInstance.post).toHaveBeenCalledWith("/search/spaces", {
      query: "design",
      limit: 5,
    });
  });

  it("askContent posts everything in the body, the space-reputation options too, as a stream request", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.post.mockResolvedValueOnce({ data: sseStream([]) });
    await collect(
      askContent(client, {
        query: "what is this space about?",
        spaceId: "s1",
        spaceReputation: { spaceId: "rep1", includeDescendants: false },
      }),
    );
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/search/ask",
      {
        query: "what is this space about?",
        spaceId: "s1",
        spaceReputationId: "rep1",
        spaceReputationDescendants: false,
      },
      { responseType: "stream", signal: undefined },
    );
  });

  it("matchUsers POSTs the full body to /match/users", async () => {
    const { client, projectInstance } = makeClient();
    await matchUsers(client, {
      actingUserId: "asker1",
      mode: "directed",
      query: "biotech",
      limit: 10,
      spaceId: "space-1",
      includeChildSpaces: true,
      includeSampleContent: true,
      excludeSelf: false,
    });
    expect(projectInstance.post).toHaveBeenCalledWith("/match/users", {
      actingUserId: "asker1",
      mode: "directed",
      query: "biotech",
      limit: 10,
      spaceId: "space-1",
      includeChildSpaces: true,
      includeSampleContent: true,
      excludeSelf: false,
    });
  });

  it("matchUsers passes a minimal passive body through unchanged", async () => {
    const { client, projectInstance } = makeClient();
    await matchUsers(client, { actingUserId: "asker1", mode: "passive" });
    expect(projectInstance.post).toHaveBeenCalledWith("/match/users", {
      actingUserId: "asker1",
      mode: "passive",
    });
  });
});

describe("node-sdk search — response mapping", () => {
  it("searchContent returns the result array", async () => {
    const { client, projectInstance } = makeClient();
    const results = [{ sourceType: "entity", similarity: 0.9, record: { id: "e1" } }];
    projectInstance.post.mockResolvedValueOnce({ data: results });
    await expect(searchContent(client, { query: "hello" })).resolves.toEqual(results);
  });

  it("searchUsers returns the result array", async () => {
    const { client, projectInstance } = makeClient();
    const results = [{ similarity: 0.9, record: { id: "u1" } }];
    projectInstance.post.mockResolvedValueOnce({ data: results });
    await expect(searchUsers(client, { query: "ali" })).resolves.toEqual(results);
  });

  it("searchSpaces returns the result array", async () => {
    const { client, projectInstance } = makeClient();
    const results = [{ similarity: 0.9, record: { id: "s1" } }];
    projectInstance.post.mockResolvedValueOnce({ data: results });
    await expect(searchSpaces(client, { query: "design" })).resolves.toEqual(results);
  });

  it("matchUsers returns the { results } envelope from the response body", async () => {
    const { client, projectInstance } = makeClient();
    const envelope: MatchUsersResponse = {
      results: [
        {
          user: { id: "u1" } as MatchUsersResponse["results"][number]["user"],
          score: 1.5,
          matchedFacets: [
            {
              similarity: 0.7,
              askerFacet: { id: "af", hotness: 3 },
              candidateFacet: { id: "cf", hotness: 4 },
            },
          ],
        },
      ],
    };
    projectInstance.post.mockResolvedValueOnce({ data: envelope });
    const res = await matchUsers(client, { actingUserId: "asker1", mode: "passive" });
    expect(res).toEqual(envelope);
    expect(res.results[0].matchedFacets[0].candidateFacet.hotness).toBe(4);
  });
});

describe("node-sdk search — askContent stream", () => {
  const frame = (event: string, data: unknown) =>
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  it("yields tokens, sources and done in order", async () => {
    const { client, projectInstance } = makeClient();
    const sources = [{ sourceType: "entity", similarity: 0.9, record: { id: "e1" } }];
    projectInstance.post.mockResolvedValueOnce({
      data: sseStream([
        frame("token", { content: "Hel" }),
        frame("token", { content: "lo" }),
        frame("sources", sources),
        frame("done", {}),
      ]),
    });
    expect(await collect(askContent(client, { query: "q" }))).toEqual([
      { type: "token", content: "Hel" },
      { type: "token", content: "lo" },
      { type: "sources", sources },
      { type: "done" },
    ]);
  });

  it("joins an event split across chunks", async () => {
    const { client, projectInstance } = makeClient();
    const whole = frame("token", { content: "split" }) + frame("done", {});
    projectInstance.post.mockResolvedValueOnce({
      data: sseStream([whole.slice(0, 9), whole.slice(9, 30), whole.slice(30)]),
    });
    expect(await collect(askContent(client, { query: "q" }))).toEqual([
      { type: "token", content: "split" },
      { type: "done" },
    ]);
  });

  it("yields the server's in-stream error frame with its code", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.post.mockResolvedValueOnce({
      data: sseStream([
        frame("token", { content: "a" }),
        frame("error", { error: "Internal server error", code: "search/server-error" }),
      ]),
    });
    expect(await collect(askContent(client, { query: "q" }))).toEqual([
      { type: "token", content: "a" },
      { type: "error", error: "Internal server error", code: "search/server-error" },
    ]);
  });

  it("throws a refused request with its JSON error body read back from the stream", async () => {
    const { client, projectInstance } = makeClient();
    const body = { error: "Semantic search requires a paid plan", code: "project/plan-required" };
    const err = new AxiosError("Request failed with status code 403", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 403,
      statusText: "Forbidden",
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: sseStream([JSON.stringify(body)]),
    });
    projectInstance.post.mockRejectedValueOnce(err);
    await expect(collect(askContent(client, { query: "q" }))).rejects.toMatchObject({
      response: { status: 403, data: body },
    });
  });

  it("closes the stream when the caller stops early", async () => {
    const { client, projectInstance } = makeClient();
    const stream = sseStream([frame("token", { content: "a" }), frame("token", { content: "b" })]);
    projectInstance.post.mockResolvedValueOnce({ data: stream });
    for await (const ev of askContent(client, { query: "q" })) {
      expect(ev).toEqual({ type: "token", content: "a" });
      break;
    }
    expect(stream.destroyed).toBe(true);
  });
});
