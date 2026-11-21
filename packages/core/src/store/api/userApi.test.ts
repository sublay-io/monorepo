import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  makeRtkQueryStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
  type RtkQueryStore,
} from "../../test-utils";
import { userApi, buildUserUpdateFormData, userUpdateHasFiles } from "./userApi";

let fetchHandle: FetchMockHandle;
let store: RtkQueryStore;

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
  store = makeRtkQueryStore();
});

afterEach(() => {
  unstubFetchMock();
});

const options = { mode: "original-aspect" as const, sizes: { small: 64 } };
const FILE_ID = "11111111-1111-4111-8111-111111111111";

describe("userApi", () => {
  it("updateUser sends the update as a JSON PATCH body", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "user-1", name: "New" }));

    await store.dispatch(
      userApi.endpoints.updateUser.initiate({
        projectId: "test-project",
        userId: "user-1",
        update: { name: "New", avatar: "https://cdn.example/a.png", removeFileIds: [FILE_ID] },
      }),
    );

    expect(fetchHandle.calls()).toHaveLength(1);
    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("PATCH");
    expect(call.url).toContain("/test-project/users/user-1");
    expect(call.contentType).toBe("application/json");
    expect(JSON.parse(call.body as string)).toEqual({
      name: "New",
      avatar: "https://cdn.example/a.png",
      removeFileIds: [FILE_ID],
    });
  });

  it("returns the updated user on success", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "user-1", name: "New" }));

    const result = await store.dispatch(
      userApi.endpoints.updateUser.initiate({
        projectId: "test-project",
        userId: "user-1",
        update: { name: "New" },
      }),
    );

    expect(result.data).toEqual({ id: "user-1", name: "New" });
  });

  it("surfaces a non-2xx response as a mutation error", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));

    const result = await store.dispatch(
      userApi.endpoints.updateUser.initiate({
        projectId: "test-project",
        userId: "user-1",
        update: { name: "New" },
      }),
    );

    expect((result.error as { status: number } | undefined)?.status).toBe(500);
  });
});

describe("userUpdateHasFiles", () => {
  it("is true only when the update carries avatarFile or bannerFile", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    expect(userUpdateHasFiles({ avatarFile: { file, options } })).toBe(true);
    expect(userUpdateHasFiles({ bannerFile: { file, options } })).toBe(true);
    expect(userUpdateHasFiles({ avatar: "https://cdn.example/a.png" })).toBe(false);
    expect(userUpdateHasFiles({ removeFileIds: [FILE_ID] })).toBe(false);
  });
});

describe("buildUserUpdateFormData", () => {
  it("names the files avatarFile/bannerFile with their `.options`, and keeps the URL avatar as `avatar`", () => {
    const avatar = new File(["a"], "avatar.png", { type: "image/png" });
    const banner = new File(["b"], "banner.png", { type: "image/png" });
    const formData = buildUserUpdateFormData({
      name: "New",
      avatar: "https://cdn.example/a.png",
      avatarFile: { file: avatar, options },
      bannerFile: { file: banner, options },
      removeFileIds: [FILE_ID],
    });

    expect([...formData.keys()].sort()).toEqual(
      [
        "avatar",
        "avatarFile",
        "avatarFile.options",
        "bannerFile",
        "bannerFile.options",
        "name",
        "removeFileIds",
      ].sort(),
    );
    expect(formData.get("name")).toBe("New");
    expect(formData.get("avatar")).toBe("https://cdn.example/a.png");
    expect((formData.get("avatarFile") as File).name).toBe("avatar.png");
    expect(formData.get("avatarFile.options")).toBe(JSON.stringify(options));
    expect((formData.get("bannerFile") as File).name).toBe("banner.png");
    expect(formData.get("bannerFile.options")).toBe(JSON.stringify(options));
    expect(formData.get("removeFileIds")).toBe(JSON.stringify([FILE_ID]));
  });

  it("serializes location/metadata/secureMetadata as JSON strings", () => {
    const formData = buildUserUpdateFormData({
      location: { latitude: 1, longitude: 2 },
      metadata: { foo: "bar" },
      secureMetadata: { s: 1 },
      bannerFile: { file: new File(["x"], "banner.png"), options },
    });

    expect(JSON.parse(formData.get("location") as string)).toEqual({ latitude: 1, longitude: 2 });
    expect(JSON.parse(formData.get("metadata") as string)).toEqual({ foo: "bar" });
    expect(JSON.parse(formData.get("secureMetadata") as string)).toEqual({ s: 1 });
  });
});
