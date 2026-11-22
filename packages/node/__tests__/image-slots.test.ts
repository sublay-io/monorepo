import { createSpace, updateSpace } from "../src/modules/spaces";
import { updateUser } from "../src/modules/users";
import { signUp } from "../src/modules/auth";
import { makeClient } from "./helpers/mockClient";

/**
 * Avatar/banner uploads: `avatarFile` / `bannerFile` slots (each with its
 * `<field>.options` JSON string) and `removeFileIds`, on the space, user and
 * sign-up requests. JSON is kept when no file is sent.
 */

const FILE_ID = "11111111-1111-4111-8111-111111111111";
const avatarOptions = { mode: "original-aspect" as const, sizes: { thumbnail: 200 } };
const bannerOptions = { mode: "original-aspect" as const, sizes: { full: 1200 } };
const bytes = () => new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function keys(formData: FormData): string[] {
  return [...formData.keys()].sort();
}

describe("node-sdk image slots — createSpace", () => {
  it("sends avatarFile/bannerFile with their options as multipart, fields as strings", async () => {
    const { client, projectInstance } = makeClient();
    await createSpace(client, {
      actingUserId: "u1",
      name: "My Space",
      metadata: { a: 1 },
      avatarFile: { file: bytes(), filename: "a.png", mimeType: "image/png", options: avatarOptions },
      bannerFile: { file: new Blob(["b"], { type: "image/webp" }), options: bannerOptions },
    });

    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/spaces");
    expect(body).toBeInstanceOf(FormData);
    const formData = body as FormData;
    expect(keys(formData)).toEqual(
      ["actingUserId", "avatarFile", "avatarFile.options", "bannerFile", "bannerFile.options", "metadata", "name"],
    );
    expect(formData.get("actingUserId")).toBe("u1");
    expect(formData.get("metadata")).toBe(JSON.stringify({ a: 1 }));

    const avatar = formData.get("avatarFile") as File;
    expect(avatar.name).toBe("a.png");
    expect(avatar.type).toBe("image/png");
    expect(formData.get("avatarFile.options")).toBe(JSON.stringify(avatarOptions));

    const banner = formData.get("bannerFile") as File;
    expect(banner.name).toBe("banner");
    expect(banner.type).toBe("image/webp");
    expect(formData.get("bannerFile.options")).toBe(JSON.stringify(bannerOptions));
  });

  it("stays JSON without files", async () => {
    const { client, projectInstance } = makeClient();
    await createSpace(client, { actingUserId: "u1", name: "My Space" });
    const [, body] = projectInstance.post.mock.calls[0];
    expect(body).not.toBeInstanceOf(FormData);
    expect(body).toEqual({ actingUserId: "u1", name: "My Space" });
  });
});

describe("node-sdk image slots — updateSpace", () => {
  it("sends an avatar and removeFileIds as multipart", async () => {
    const { client, projectInstance } = makeClient();
    await updateSpace(client, {
      spaceId: "s1",
      actingUserId: "u1",
      removeFileIds: [FILE_ID],
      avatarFile: { file: bytes(), mimeType: "image/png", options: avatarOptions },
    });

    const [path, body] = projectInstance.patch.mock.calls[0];
    expect(path).toBe("/spaces/s1");
    const formData = body as FormData;
    expect(keys(formData)).toEqual(["actingUserId", "avatarFile", "avatarFile.options", "removeFileIds"]);
    expect((formData.get("avatarFile") as File).name).toBe("avatar");
    expect(formData.get("avatarFile.options")).toBe(JSON.stringify(avatarOptions));
    expect(formData.get("removeFileIds")).toBe(JSON.stringify([FILE_ID]));
  });

  it("sends removeFileIds alone as JSON", async () => {
    const { client, projectInstance } = makeClient();
    await updateSpace(client, { spaceId: "s1", actingUserId: "u1", removeFileIds: [FILE_ID] });
    expect(projectInstance.patch).toHaveBeenCalledWith("/spaces/s1", {
      actingUserId: "u1",
      removeFileIds: [FILE_ID],
    });
  });
});

describe("node-sdk image slots — updateUser", () => {
  it("sends a banner and removeFileIds as multipart", async () => {
    const { client, projectInstance } = makeClient();
    await updateUser(client, {
      userId: "u1",
      actingUserId: "u1",
      birthdate: "2000-01-02T00:00:00.000Z",
      location: { latitude: 1, longitude: 2 },
      removeFileIds: [FILE_ID],
      bannerFile: { file: bytes(), filename: "b.png", mimeType: "image/png", options: bannerOptions },
    });

    const [path, body] = projectInstance.patch.mock.calls[0];
    expect(path).toBe("/users/u1");
    const formData = body as FormData;
    expect(keys(formData)).toEqual(
      ["actingUserId", "bannerFile", "bannerFile.options", "birthdate", "location", "removeFileIds"],
    );
    expect(formData.get("birthdate")).toBe("2000-01-02T00:00:00.000Z");
    expect(formData.get("location")).toBe(JSON.stringify({ latitude: 1, longitude: 2 }));
    expect((formData.get("bannerFile") as File).name).toBe("b.png");
    expect(formData.get("bannerFile.options")).toBe(JSON.stringify(bannerOptions));
    expect(formData.get("removeFileIds")).toBe(JSON.stringify([FILE_ID]));
  });

  it("keeps the URL avatar as `avatar` and sends JSON without files", async () => {
    const { client, projectInstance } = makeClient();
    await updateUser(client, {
      userId: "u1",
      actingUserId: "u1",
      avatar: "https://cdn.example/a.png",
      removeFileIds: [FILE_ID],
    });
    expect(projectInstance.patch).toHaveBeenCalledWith("/users/u1", {
      actingUserId: "u1",
      avatar: "https://cdn.example/a.png",
      removeFileIds: [FILE_ID],
    });
  });
});

describe("node-sdk image slots — signUp", () => {
  it("sends avatarFile and bannerFile with their options as multipart", async () => {
    const { client, projectInstance } = makeClient();
    await signUp(client, {
      email: "a@b.com",
      password: "pw",
      emailVerification: { mode: "code" },
      avatarFile: { file: bytes(), filename: "a.png", mimeType: "image/png", options: avatarOptions },
      bannerFile: { file: bytes(), filename: "b.png", mimeType: "image/png", options: bannerOptions },
    });

    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/auth/sign-up");
    const formData = body as FormData;
    expect(keys(formData)).toEqual(
      ["avatarFile", "avatarFile.options", "bannerFile", "bannerFile.options", "email", "emailVerification", "password"],
    );
    expect(formData.get("emailVerification")).toBe(JSON.stringify({ mode: "code" }));
    expect((formData.get("avatarFile") as File).name).toBe("a.png");
    expect(formData.get("avatarFile.options")).toBe(JSON.stringify(avatarOptions));
    expect((formData.get("bannerFile") as File).name).toBe("b.png");
    expect(formData.get("bannerFile.options")).toBe(JSON.stringify(bannerOptions));
  });

  it("stays JSON without files", async () => {
    const { client, projectInstance } = makeClient();
    await signUp(client, { email: "a@b.com", password: "pw" });
    const [, body] = projectInstance.post.mock.calls[0];
    expect(body).not.toBeInstanceOf(FormData);
  });
});
