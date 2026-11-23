import { createSpace, updateSpace } from "../src/modules/spaces";
import { updateUser } from "../src/modules/users";
import { signUp } from "../src/modules/auth";
import { createGroupConversation, updateConversation } from "../src/modules/chat";
import { createEvent, updateEvent } from "../src/modules/events";
import { makeClient } from "./helpers/mockClient";

/**
 * Single-image slots: `avatarFile` / `bannerFile` / `coverFile` (each with its
 * `<field>.options` JSON string) and `removeFileIds`, on the space, user,
 * sign-up, conversation and event requests. JSON is kept when no file is sent.
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
      birthdate: new Date("2000-01-02T00:00:00.000Z"),
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

describe("node-sdk image slots — a null field can't travel with a file", () => {
  const avatarFile = { file: bytes(), mimeType: "image/png", options: avatarOptions };

  it.each([
    ["updateSpace", (c: any) => updateSpace(c, { spaceId: "s1", actingUserId: "u1", description: null, avatarFile }), "description"],
    ["updateUser", (c: any) => updateUser(c, { userId: "u1", actingUserId: "u1", bio: null, avatarFile }), "bio"],
  ])("%s throws before sending anything", async (fn, call, field) => {
    const { client, projectInstance } = makeClient();
    await expect(call(client)).rejects.toThrow(`${fn}: \`${field}: null\` can't be sent with a file`);
    expect(projectInstance.post).not.toHaveBeenCalled();
    expect(projectInstance.patch).not.toHaveBeenCalled();
  });

  it("leaves a null field out of a create's multipart body (null there means none)", async () => {
    const { client, projectInstance } = makeClient();
    await createSpace(client, { actingUserId: "u1", slug: null, parentSpaceId: null, avatarFile });
    await signUp(client, { email: "a@b.co", password: "pw", name: null, avatarFile });
    const spaceForm = projectInstance.post.mock.calls[0][1] as FormData;
    const signUpForm = projectInstance.post.mock.calls[1][1] as FormData;
    expect(spaceForm.has("slug")).toBe(false);
    expect(spaceForm.has("parentSpaceId")).toBe(false);
    expect(signUpForm.has("name")).toBe(false);
    expect(signUpForm.get("email")).toBe("a@b.co");
  });

  it("sends null as JSON when no file is attached", async () => {
    const { client, projectInstance } = makeClient();
    await updateSpace(client, { spaceId: "s1", actingUserId: "u1", slug: null, description: null });
    expect(projectInstance.patch).toHaveBeenCalledWith("/spaces/s1", {
      actingUserId: "u1",
      slug: null,
      description: null,
    });
  });
});

const coverOptions = { mode: "original-aspect" as const, sizes: { full: 1600 } };

describe("node-sdk image slots — createGroupConversation", () => {
  it("sends avatarFile with its options as multipart, type 'group' and fields as strings", async () => {
    const { client, projectInstance } = makeClient();
    await createGroupConversation(client, {
      actingUserId: "u1",
      name: "Team",
      memberIds: ["u2", "u3"],
      metadata: { topic: "launch" },
      avatarFile: { file: bytes(), filename: "a.png", mimeType: "image/png", options: avatarOptions },
    });

    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/chat/conversations");
    expect(body).toBeInstanceOf(FormData);
    const formData = body as FormData;
    expect(keys(formData)).toEqual(
      ["actingUserId", "avatarFile", "avatarFile.options", "memberIds", "metadata", "name", "type"],
    );
    expect(formData.get("type")).toBe("group");
    expect(formData.get("memberIds")).toBe(JSON.stringify(["u2", "u3"]));
    expect(formData.get("metadata")).toBe(JSON.stringify({ topic: "launch" }));
    const avatar = formData.get("avatarFile") as File;
    expect(avatar.name).toBe("a.png");
    expect(avatar.type).toBe("image/png");
    expect(formData.get("avatarFile.options")).toBe(JSON.stringify(avatarOptions));
  });

  it("stays JSON without files", async () => {
    const { client, projectInstance } = makeClient();
    await createGroupConversation(client, { actingUserId: "u1", name: "Team" });
    expect(projectInstance.post).toHaveBeenCalledWith("/chat/conversations", {
      type: "group",
      actingUserId: "u1",
      name: "Team",
    });
  });
});

describe("node-sdk image slots — updateConversation", () => {
  it("sends an avatar and removeFileIds as multipart", async () => {
    const { client, projectInstance } = makeClient();
    await updateConversation(client, {
      conversationId: "c1",
      actingUserId: "u1",
      name: "New name",
      removeFileIds: [FILE_ID],
      avatarFile: { file: new Blob(["a"], { type: "image/webp" }), options: avatarOptions },
    });

    const [path, body] = projectInstance.patch.mock.calls[0];
    expect(path).toBe("/chat/conversations/c1");
    const formData = body as FormData;
    expect(keys(formData)).toEqual(
      ["actingUserId", "avatarFile", "avatarFile.options", "name", "removeFileIds"],
    );
    const avatar = formData.get("avatarFile") as File;
    expect(avatar.name).toBe("avatar");
    expect(avatar.type).toBe("image/webp");
    expect(formData.get("avatarFile.options")).toBe(JSON.stringify(avatarOptions));
    expect(formData.get("removeFileIds")).toBe(JSON.stringify([FILE_ID]));
  });

  it("sends removeFileIds alone as JSON", async () => {
    const { client, projectInstance } = makeClient();
    await updateConversation(client, { conversationId: "c1", actingUserId: "u1", removeFileIds: [FILE_ID] });
    expect(projectInstance.patch).toHaveBeenCalledWith("/chat/conversations/c1", {
      actingUserId: "u1",
      removeFileIds: [FILE_ID],
    });
  });
});

describe("node-sdk image slots — createEvent", () => {
  it("sends coverFile with its options as multipart, fields as strings", async () => {
    const { client, projectInstance } = makeClient();
    await createEvent(client, {
      actingUserId: "u1",
      title: "Launch",
      type: "online",
      startTime: new Date("2026-07-01T18:00:00.000Z"),
      hostIds: ["u2"],
      capacity: 50,
      coverFile: { file: bytes(), filename: "c.png", mimeType: "image/png", options: coverOptions },
    });

    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/events");
    expect(body).toBeInstanceOf(FormData);
    const formData = body as FormData;
    expect(keys(formData)).toEqual(
      ["actingUserId", "capacity", "coverFile", "coverFile.options", "hostIds", "startTime", "title", "type"],
    );
    expect(formData.get("startTime")).toBe("2026-07-01T18:00:00.000Z");
    expect(formData.get("hostIds")).toBe(JSON.stringify(["u2"]));
    expect(formData.get("capacity")).toBe("50");
    expect((formData.get("coverFile") as File).name).toBe("c.png");
    expect(formData.get("coverFile.options")).toBe(JSON.stringify(coverOptions));
  });

  it("stays JSON without files", async () => {
    const { client, projectInstance } = makeClient();
    await createEvent(client, { actingUserId: "u1", title: "Launch", type: "online", startTime: "2026-07-01T18:00:00Z" });
    const [, body] = projectInstance.post.mock.calls[0];
    expect(body).not.toBeInstanceOf(FormData);
  });
});

describe("node-sdk image slots — updateEvent", () => {
  it("sends a cover and removeFileIds as multipart", async () => {
    const { client, projectInstance } = makeClient();
    await updateEvent(client, {
      eventId: "e1",
      actingUserId: "u1",
      removeFileIds: [FILE_ID],
      coverFile: { file: bytes(), mimeType: "image/png", options: coverOptions },
    });

    const [path, body] = projectInstance.patch.mock.calls[0];
    expect(path).toBe("/events/e1");
    const formData = body as FormData;
    expect(keys(formData)).toEqual(["actingUserId", "coverFile", "coverFile.options", "removeFileIds"]);
    expect((formData.get("coverFile") as File).name).toBe("cover");
    expect(formData.get("coverFile.options")).toBe(JSON.stringify(coverOptions));
    expect(formData.get("removeFileIds")).toBe(JSON.stringify([FILE_ID]));
  });

  it("sends removeFileIds alone as JSON", async () => {
    const { client, projectInstance } = makeClient();
    await updateEvent(client, { eventId: "e1", actingUserId: "u1", removeFileIds: [FILE_ID] });
    expect(projectInstance.patch).toHaveBeenCalledWith("/events/e1", {
      actingUserId: "u1",
      removeFileIds: [FILE_ID],
    });
  });
});
