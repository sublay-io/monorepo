import { fetchDrafts, fetchManyEntities } from "../src/modules/entities";
import { fetchManyEvents } from "../src/modules/events";
import { fetchManySpaces } from "../src/modules/spaces";
import { fetchCommentsByUserId } from "../src/modules/users";
import { SublayHttpClient } from "../src/core/client";
import { makeClient } from "./helpers/client";

// "Has none" on a URL filter is the word `none`, always the caller's explicit
// choice: the SDK sends it as given and never sends `null` for it.
describe("js-sdk `none` filters", () => {
  const paramsOf = (get: jest.Mock) => get.mock.calls[0][1].params;

  it("fetchManySpaces sends parentSpaceId \"none\" / \"any\" as given, and leaves it out by default (the API's top-level default)", async () => {
    const { client, projectInstance } = makeClient();
    await fetchManySpaces(client, { parentSpaceId: "any" });
    expect(projectInstance.get.mock.calls[0][1].params.parentSpaceId).toBe("any");
    projectInstance.get.mockClear();
    await fetchManySpaces(client, { parentSpaceId: "none" });
    await fetchManySpaces(client, { });
    expect(projectInstance.get.mock.calls[0][1].params.parentSpaceId).toBe("none");
    expect(projectInstance.get.mock.calls[1][1].params.parentSpaceId).toBeUndefined();
  });

  it("fetchManyEntities sends sourceId / spaceId \"none\" as given", async () => {
    const { client, projectInstance } = makeClient();
    await fetchManyEntities(client, { sourceId: "none", spaceId: "none" });
    expect(paramsOf(projectInstance.get)).toMatchObject({ sourceId: "none", spaceId: "none" });
  });

  it("fetchDrafts sends sourceId / spaceId \"none\" as given", async () => {
    const { client, projectInstance } = makeClient();
    await fetchDrafts(client, { sourceId: "none", spaceId: "none" });
    expect(paramsOf(projectInstance.get)).toMatchObject({ sourceId: "none", spaceId: "none" });
  });

  it("fetchCommentsByUserId sends sourceId \"none\" as given", async () => {
    const { client, projectInstance } = makeClient();
    await fetchCommentsByUserId(client, { userId: "u2", sourceId: "none" });
    expect(paramsOf(projectInstance.get)).toMatchObject({ sourceId: "none" });
  });

  it("fetchManyEvents sends spaceId \"none\" as given", async () => {
    const { client, projectInstance } = makeClient();
    await fetchManyEvents(client, { spaceId: "none" });
    expect(paramsOf(projectInstance.get)).toMatchObject({ spaceId: "none" });
  });

  it("the HTTP client leaves out null and undefined params (no filter), never sending \"null\"", () => {
    const client = new SublayHttpClient({ projectId: "proj1", getToken: async () => null });
    const uri = client.projectInstance.getUri({
      url: "/entities",
      params: { sourceId: null, spaceId: undefined, parentSpaceId: "none" },
    });
    expect(uri).toContain("parentSpaceId=none");
    expect(uri).not.toContain("sourceId");
    expect(uri).not.toContain("spaceId=");
    expect(uri).not.toContain("null");
  });
});
