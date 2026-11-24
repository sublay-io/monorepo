import {
  addHost,
  addInvite,
  cancelEvent,
  createEvent,
  deleteEvent,
  fetchEvent,
  fetchEventRsvps,
  fetchInvitees,
  fetchManyEvents,
  removeHost,
  removeInvite,
  setRsvp,
  updateEvent,
  withdrawRsvp,
} from "../src/modules/events";
import { formDataToObject, makeClient } from "./helpers/client";

describe("js-sdk events — request shaping", () => {
  it("createEvent posts the full body to /events as JSON when there is no cover or list files", async () => {
    const { client, projectInstance } = makeClient();
    const data = {
      title: "Launch party",
      startTime: "2026-07-01T18:00:00Z",
      type: "physical" as const,
    };
    await createEvent(client, data);
    expect(projectInstance.post).toHaveBeenCalledWith("/events", data);
  });

  it("createEvent sends multipart/FormData when a cover image is present", async () => {
    const { client, projectInstance } = makeClient();
    const file = new File(["cover-bytes"], "cover.png", {
      type: "image/png",
    });
    await createEvent(client, {
      title: "Launch party",
      startTime: "2026-07-01T18:00:00Z",
      type: "physical",
      coverFile: {
        file,
        options: { mode: "original-aspect", sizes: { thumbnail: 200 } },
      },
    });

    expect(projectInstance.post).toHaveBeenCalledTimes(1);
    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/events");
    expect(body).toBeInstanceOf(FormData);

    const obj = formDataToObject(body as FormData);
    expect(obj.title).toBe("Launch party");
    expect(obj.startTime).toBe("2026-07-01T18:00:00Z");
    expect(obj.type).toBe("physical");
    expect(obj["coverFile.options"]).toBe(
      JSON.stringify({ mode: "original-aspect", sizes: { thumbnail: 200 } })
    );
    expect(obj.coverFile).toBeInstanceOf(File);
    expect(obj).not.toHaveProperty("cover");
    expect((obj.coverFile as File).name).toBe("cover.png");
  });

  it("createEvent sends Date start and end times as ISO strings in multipart", async () => {
    const { client, projectInstance } = makeClient();
    await createEvent(client, {
      title: "Launch party",
      startTime: new Date("2026-07-01T18:00:00.000Z"),
      endTime: new Date("2026-07-01T20:00:00.000Z"),
      type: "physical",
      coverFile: {
        file: new File(["cover-bytes"], "cover.png", { type: "image/png" }),
        options: { mode: "original-aspect", sizes: { thumbnail: 200 } },
      },
    });

    const [, body] = projectInstance.post.mock.calls[0];
    const obj = formDataToObject(body as FormData);
    expect(obj.startTime).toBe("2026-07-01T18:00:00.000Z");
    expect(obj.endTime).toBe("2026-07-01T20:00:00.000Z");
  });

  it("createEvent sends multipart/FormData with the event's images and files", async () => {
    const { client, projectInstance } = makeClient();
    const file1 = new File(["a"], "g1.png", { type: "image/png" });
    const file2 = new File(["b"], "g2.png", { type: "image/png" });
    await createEvent(client, {
      title: "Gallery event",
      startTime: "2026-08-01T18:00:00Z",
      type: "online",
      images: {
        files: [file1, file2],
        options: { mode: "original-aspect", sizes: { full: 1000 } },
      },
      files: {
        files: [new File(["c"], "doc.pdf", { type: "application/pdf" })],
        options: { pathParts: ["events"] },
      },
    });

    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/events");
    expect(body).toBeInstanceOf(FormData);

    const formData = body as FormData;
    const imageEntries = formData.getAll("images");
    expect(imageEntries).toHaveLength(2);
    expect((imageEntries[0] as File).name).toBe("g1.png");
    expect((imageEntries[1] as File).name).toBe("g2.png");
    expect(formData.get("images.options")).toBe(
      JSON.stringify({ mode: "original-aspect", sizes: { full: 1000 } })
    );
    expect(formData.getAll("files")).toHaveLength(1);
    expect(formData.get("files.options")).toBe(
      JSON.stringify({ pathParts: ["events"] })
    );
    expect(formData.has("gallery")).toBe(false);
  });

  it("createEvent ignores empty images and files lists and sends plain JSON", async () => {
    const { client, projectInstance } = makeClient();
    await createEvent(client, {
      title: "No actual files",
      startTime: "2026-08-01T18:00:00Z",
      type: "online",
      images: { files: [], options: { mode: "original-aspect", sizes: {} } },
      files: { files: [] },
    });

    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/events");
    expect(body).not.toBeInstanceOf(FormData);
    expect(body).toEqual({
      title: "No actual files",
      startTime: "2026-08-01T18:00:00Z",
      type: "online",
    });
  });

  it("fetchEvent strips eventId into the path and passes the rest as params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchEvent(client, { eventId: "ev1", include: ["user", "space"] });
    expect(projectInstance.get).toHaveBeenCalledWith("/events/ev1", {
      params: { include: "user,space" },
    });
  });

  it("fetchManyEvents gets /events with the full query as params", async () => {
    const { client, projectInstance } = makeClient();
    const query = { timeWindow: "upcoming" as const, spaceId: "s1" };
    await fetchManyEvents(client, query);
    expect(projectInstance.get).toHaveBeenCalledWith("/events", {
      params: query,
    });
  });

  it("fetchManyEvents sends Date startsAfter / startsBefore as ISO strings", async () => {
    const { client, projectInstance } = makeClient();
    await fetchManyEvents(client, {
      startsAfter: new Date("2026-07-01T00:00:00.000Z"),
      startsBefore: "2026-08-01T00:00:00.000Z",
    });
    const [, config] = projectInstance.get.mock.calls[0];
    expect(config.params.startsAfter).toBe("2026-07-01T00:00:00.000Z");
    expect(config.params.startsBefore).toBe("2026-08-01T00:00:00.000Z");
  });

  it("fetchManyEvents defaults to an empty params object when called with no args", async () => {
    const { client, projectInstance } = makeClient();
    await fetchManyEvents(client);
    expect(projectInstance.get).toHaveBeenCalledWith("/events", {
      params: {},
    });
  });

  it("fetchManyEvents serializes locationFilters as a raw nested params object", async () => {
    const { client, projectInstance } = makeClient();
    const data = {
      locationFilters: { latitude: "40.0", longitude: "-73.0", radius: "5" },
    };
    await fetchManyEvents(client, data);
    expect(projectInstance.get).toHaveBeenCalledWith("/events", {
      params: data,
    });
    const [, config] = projectInstance.get.mock.calls[0];
    expect(config.params.locationFilters).toEqual({
      latitude: "40.0",
      longitude: "-73.0",
      radius: "5",
    });
  });

  it("fetchManyEvents serializes titleFilters/descriptionFilters as raw nested params objects", async () => {
    const { client, projectInstance } = makeClient();
    const data = {
      titleFilters: { hasTitle: "true" as const, includes: "launch" },
      descriptionFilters: { hasDescription: "false" as const },
    };
    await fetchManyEvents(client, data);
    expect(projectInstance.get).toHaveBeenCalledWith("/events", {
      params: data,
    });
  });

  it("updateEvent strips eventId into the path and patches the rest as JSON when there is no cover or list files", async () => {
    const { client, projectInstance } = makeClient();
    await updateEvent(client, { eventId: "ev1", title: "New title" });
    expect(projectInstance.patch).toHaveBeenCalledWith("/events/ev1", {
      title: "New title",
    });
  });

  it("updateEvent sends removeFileIds in the plain JSON body", async () => {
    const { client, projectInstance } = makeClient();
    await updateEvent(client, {
      eventId: "ev1",
      removeFileIds: ["img1", "img2"],
    });
    expect(projectInstance.patch).toHaveBeenCalledWith("/events/ev1", {
      removeFileIds: ["img1", "img2"],
    });
  });

  it("updateEvent sends multipart/FormData with a JSON-stringified removeFileIds when a cover image is attached", async () => {
    const { client, projectInstance } = makeClient();
    const file = new File(["cover-bytes"], "newcover.png", {
      type: "image/png",
    });
    await updateEvent(client, {
      eventId: "ev1",
      removeFileIds: ["old-cover-id"],
      coverFile: {
        file,
        options: { mode: "original-aspect", sizes: { thumbnail: 200 } },
      },
    });

    const [path, body] = projectInstance.patch.mock.calls[0];
    expect(path).toBe("/events/ev1");
    expect(body).toBeInstanceOf(FormData);

    const obj = formDataToObject(body as FormData);
    expect(obj.removeFileIds).toBe(JSON.stringify(["old-cover-id"]));
    expect(obj).not.toHaveProperty("removeImageIds");
    expect(obj.coverFile).toBeInstanceOf(File);
    expect(obj).not.toHaveProperty("cover");
    expect((obj.coverFile as File).name).toBe("newcover.png");
    expect(obj["coverFile.options"]).toBe(
      JSON.stringify({ mode: "original-aspect", sizes: { thumbnail: 200 } })
    );
  });

  it("updateEvent sends multipart/FormData with appended images", async () => {
    const { client, projectInstance } = makeClient();
    const file1 = new File(["a"], "g1.png", { type: "image/png" });
    await updateEvent(client, {
      eventId: "ev1",
      images: {
        files: [file1],
        options: { mode: "original-aspect", sizes: { full: 1000 } },
      },
    });

    const [path, body] = projectInstance.patch.mock.calls[0];
    expect(path).toBe("/events/ev1");
    expect(body).toBeInstanceOf(FormData);

    const formData = body as FormData;
    expect(formData.getAll("images")).toHaveLength(1);
    expect(formData.get("images.options")).toBe(
      JSON.stringify({ mode: "original-aspect", sizes: { full: 1000 } })
    );
  });

  it("updateEvent sends include in the body: as given in JSON, comma-joined in multipart", async () => {
    const { client, projectInstance } = makeClient();
    await updateEvent(client, { eventId: "ev1", title: "t", include: "files" });
    expect(projectInstance.patch).toHaveBeenCalledWith("/events/ev1", {
      title: "t",
      include: "files",
    });
    await updateEvent(client, {
      eventId: "ev1",
      include: ["files"],
      images: {
        files: [new File(["a"], "g1.png", { type: "image/png" })],
        options: { mode: "original-aspect", sizes: { full: 1000 } },
      },
    });
    const [, body] = projectInstance.patch.mock.calls[1];
    // One `include` field holding exactly "files" (never a JSON array string).
    expect((body as FormData).getAll("include")).toEqual(["files"]);
  });

  it("updateEvent ignores empty images and files lists and sends plain JSON", async () => {
    const { client, projectInstance } = makeClient();
    await updateEvent(client, {
      eventId: "ev1",
      title: "still json",
      images: { files: [], options: { mode: "original-aspect", sizes: {} } },
      files: { files: [] },
    });

    const [path, body] = projectInstance.patch.mock.calls[0];
    expect(path).toBe("/events/ev1");
    expect(body).not.toBeInstanceOf(FormData);
    expect(body).toEqual({ title: "still json" });
  });

  it("cancelEvent posts the cancel route with no body", async () => {
    const { client, projectInstance } = makeClient();
    await cancelEvent(client, { eventId: "ev1" });
    expect(projectInstance.post).toHaveBeenCalledWith("/events/ev1/cancel");
  });

  it("deleteEvent deletes /events/:eventId", async () => {
    const { client, projectInstance } = makeClient();
    await deleteEvent(client, { eventId: "ev1" });
    expect(projectInstance.delete).toHaveBeenCalledWith("/events/ev1");
  });

  it("setRsvp strips eventId into the path and posts only status (no userId — actor derived from token)", async () => {
    const { client, projectInstance } = makeClient();
    await setRsvp(client, { eventId: "ev1", status: "going" });
    expect(projectInstance.post).toHaveBeenCalledWith("/events/ev1/rsvp", {
      status: "going",
    });
  });

  it("withdrawRsvp deletes /events/:eventId/rsvp with no body/params", async () => {
    const { client, projectInstance } = makeClient();
    await withdrawRsvp(client, { eventId: "ev1" });
    expect(projectInstance.delete).toHaveBeenCalledWith("/events/ev1/rsvp");
  });

  it("addHost posts userId (the host target) to /events/:eventId/hosts", async () => {
    const { client, projectInstance } = makeClient();
    await addHost(client, { eventId: "ev1", userId: "u1" });
    expect(projectInstance.post).toHaveBeenCalledWith("/events/ev1/hosts", {
      userId: "u1",
    });
  });

  it("removeHost puts userId (the host target) in the path, no body", async () => {
    const { client, projectInstance } = makeClient();
    await removeHost(client, { eventId: "ev1", userId: "u1" });
    expect(projectInstance.delete).toHaveBeenCalledWith("/events/ev1/hosts/u1");
  });

  it("addInvite posts userId (the invitee target) to /events/:eventId/invites", async () => {
    const { client, projectInstance } = makeClient();
    await addInvite(client, { eventId: "ev1", userId: "u1" });
    expect(projectInstance.post).toHaveBeenCalledWith("/events/ev1/invites", {
      userId: "u1",
    });
  });

  it("removeInvite puts userId (the invitee target) in the path, no body", async () => {
    const { client, projectInstance } = makeClient();
    await removeInvite(client, { eventId: "ev1", userId: "u1" });
    expect(projectInstance.delete).toHaveBeenCalledWith("/events/ev1/invites/u1");
  });

  it("fetchInvitees strips eventId into the path and passes the rest as params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchInvitees(client, { eventId: "ev1", page: 2, limit: 10 });
    expect(projectInstance.get).toHaveBeenCalledWith("/events/ev1/invites", {
      params: { page: 2, limit: 10 },
    });
  });

  it("fetchEventRsvps strips eventId into the path and passes the rest as params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchEventRsvps(client, { eventId: "ev1", status: ["going", "maybe"] });
    expect(projectInstance.get).toHaveBeenCalledWith("/events/ev1/rsvps", {
      params: { status: "going,maybe" },
    });
  });
});

describe("js-sdk events — response mapping", () => {
  it("createEvent returns the created Event (JSON path)", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1", title: "Launch party" };
    projectInstance.post.mockResolvedValueOnce({ data: event });

    const result = await createEvent(client, {
      title: "Launch party",
      startTime: "2026-07-01T18:00:00Z",
      type: "physical",
    });

    expect(result).toEqual(event);
  });

  it("createEvent returns the created Event (multipart path)", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1", title: "Launch party", coverImageId: "img1" };
    projectInstance.post.mockResolvedValueOnce({ data: event });
    const file = new File(["x"], "cover.png", { type: "image/png" });

    const result = await createEvent(client, {
      title: "Launch party",
      startTime: "2026-07-01T18:00:00Z",
      type: "physical",
      coverFile: { file, options: { mode: "original-aspect", sizes: {} } },
    });

    expect(result).toEqual(event);
  });

  it("fetchEvent returns the Event", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1" };
    projectInstance.get.mockResolvedValueOnce({ data: event });

    const result = await fetchEvent(client, { eventId: "ev1" });

    expect(result).toEqual(event);
  });

  it("fetchManyEvents returns the full PaginatedResponse envelope", async () => {
    const { client, projectInstance } = makeClient();
    const envelope = {
      data: [{ id: "ev1" }],
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 1,
        hasMore: false,
      },
    };
    projectInstance.get.mockResolvedValueOnce({ data: envelope });

    const result = await fetchManyEvents(client);

    expect(result).toEqual(envelope);
  });

  it("updateEvent returns the updated Event (JSON path)", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1", title: "New title" };
    projectInstance.patch.mockResolvedValueOnce({ data: event });

    const result = await updateEvent(client, {
      eventId: "ev1",
      title: "New title",
    });

    expect(result).toEqual(event);
  });

  it("updateEvent returns the updated Event (multipart path)", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1", coverImageId: "img2" };
    projectInstance.patch.mockResolvedValueOnce({ data: event });
    const file = new File(["x"], "newcover.png", { type: "image/png" });

    const result = await updateEvent(client, {
      eventId: "ev1",
      coverFile: { file, options: { mode: "original-aspect", sizes: {} } },
    });

    expect(result).toEqual(event);
  });

  it("cancelEvent returns the cancelled Event", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1", status: "cancelled" };
    projectInstance.post.mockResolvedValueOnce({ data: event });

    const result = await cancelEvent(client, { eventId: "ev1" });

    expect(result).toEqual(event);
  });

  it("deleteEvent resolves to undefined (void)", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.delete.mockResolvedValueOnce({ data: undefined });

    const result = await deleteEvent(client, { eventId: "ev1" });

    expect(result).toBeUndefined();
  });

  it("setRsvp returns the updated Event", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1", rsvpCounts: { going: 1, maybe: 0, "not-going": 0 } };
    projectInstance.post.mockResolvedValueOnce({ data: event });

    const result = await setRsvp(client, { eventId: "ev1", status: "going" });

    expect(result).toEqual(event);
  });

  it("withdrawRsvp returns the updated Event", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1", rsvpCounts: { going: 0, maybe: 0, "not-going": 0 } };
    projectInstance.delete.mockResolvedValueOnce({ data: event });

    const result = await withdrawRsvp(client, { eventId: "ev1" });

    expect(result).toEqual(event);
  });

  it("addHost returns the updated Event", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1", hostIds: ["u0", "u1"] };
    projectInstance.post.mockResolvedValueOnce({ data: event });

    const result = await addHost(client, { eventId: "ev1", userId: "u1" });

    expect(result).toEqual(event);
  });

  it("removeHost returns the updated Event", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1", hostIds: ["u0"] };
    projectInstance.delete.mockResolvedValueOnce({ data: event });

    const result = await removeHost(client, { eventId: "ev1", userId: "u1" });

    expect(result).toEqual(event);
  });

  it("cancelEvent returns the short body for a caller who can't see the event", async () => {
    const { client, projectInstance } = makeClient();
    const short = { id: "ev1", status: "cancelled" };
    projectInstance.post.mockResolvedValueOnce({ data: short });

    await expect(cancelEvent(client, { eventId: "ev1" })).resolves.toEqual(short);
  });

  it("withdrawRsvp returns the short body for a caller who can no longer see the event", async () => {
    const { client, projectInstance } = makeClient();
    const short = { id: "ev1", userRsvp: null };
    projectInstance.delete.mockResolvedValueOnce({ data: short });

    await expect(withdrawRsvp(client, { eventId: "ev1" })).resolves.toEqual(short);
  });

  it("removeHost returns the short body after stepping down from an event the caller can't see", async () => {
    const { client, projectInstance } = makeClient();
    const short = { id: "ev1" };
    projectInstance.delete.mockResolvedValueOnce({ data: short });

    await expect(removeHost(client, { eventId: "ev1", userId: "u1" })).resolves.toEqual(short);
  });

  it("addInvite returns the updated Event", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1" };
    projectInstance.post.mockResolvedValueOnce({ data: event });

    const result = await addInvite(client, { eventId: "ev1", userId: "u1" });

    expect(result).toEqual(event);
  });

  it("removeInvite returns the updated Event", async () => {
    const { client, projectInstance } = makeClient();
    const event = { id: "ev1" };
    projectInstance.delete.mockResolvedValueOnce({ data: event });

    const result = await removeInvite(client, { eventId: "ev1", userId: "u1" });

    expect(result).toEqual(event);
  });

  it("fetchInvitees returns the full PaginatedResponse envelope", async () => {
    const { client, projectInstance } = makeClient();
    const envelope = {
      data: [{ id: "inv1", eventId: "ev1", userId: "u1" }],
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 1,
        hasMore: false,
      },
    };
    projectInstance.get.mockResolvedValueOnce({ data: envelope });

    const result = await fetchInvitees(client, { eventId: "ev1" });

    expect(result).toEqual(envelope);
  });

  it("fetchEventRsvps returns the full PaginatedResponse envelope", async () => {
    const { client, projectInstance } = makeClient();
    const envelope = {
      data: [{ id: "rsvp1", eventId: "ev1", userId: "u1", status: "going" }],
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 1,
        hasMore: false,
      },
    };
    projectInstance.get.mockResolvedValueOnce({ data: envelope });

    const result = await fetchEventRsvps(client, { eventId: "ev1" });

    expect(result).toEqual(envelope);
  });
});
