import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useUpdateEvent from "./useUpdateEvent";

afterEach(() => {
  resetAxiosMocks();
});

describe("useUpdateEvent", () => {
  it("updates an event via a plain JSON request when there is no cover/gallery", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEvent());

    const updated = makeEvent({ title: "New title" });
    axiosPrivate.mockResponse("patch", updated);

    let returned: typeof updated | undefined;
    await act(async () => {
      returned = await result.current({
        eventId: "event-1",
        update: { title: "New title" },
      });
    });

    expect(returned).toEqual(updated);

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/events/event-1");
    expect(call.body).toEqual({ title: "New title" });
    expect(call.body instanceof FormData).toBe(false);
  });

  it("updates an event via multipart FormData when a gallery is provided", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEvent());

    const updated = makeEvent({ title: "With gallery" });
    axiosPrivate.mockResponse("patch", updated);

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current({
        eventId: "event-1",
        update: {
          title: "With gallery",
          removeFileIds: ["file-1"],
          gallery: { files: [file], options: { mode: "original-aspect", sizes: { full: 1200 } } },
        },
      });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body instanceof FormData).toBe(true);
    const formData = call.body as FormData;
    expect(formData.get("title")).toBe("With gallery");
    expect(formData.get("removeFileIds")).toBe(JSON.stringify(["file-1"]));
    expect(formData.has("removeImageIds")).toBe(false);
    expect(formData.get("gallery")).toBeInstanceOf(File);
    expect(call.config?.headers).toMatchObject({
      "Content-Type": "multipart/form-data",
    });
  });

  it("replaces the cover via multipart coverFile + coverFile.options", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEvent());
    axiosPrivate.mockResponse("patch", makeEvent());

    const file = new File(["binary"], "cover.png", { type: "image/png" });
    const options = { mode: "original-aspect" as const, sizes: { full: 1200 } };
    await act(async () => {
      await result.current({
        eventId: "event-1",
        update: { removeFileIds: ["old-cover"], coverFile: { file, options } },
      });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/events/event-1");
    const formData = call.body as FormData;
    expect(formData.get("coverFile")).toBeInstanceOf(File);
    expect(formData.get("coverFile.options")).toBe(JSON.stringify(options));
    expect(formData.get("removeFileIds")).toBe(JSON.stringify(["old-cover"]));
    expect(formData.has("cover")).toBe(false);
    expect(formData.has("cover.options")).toBe(false);
    expect(formData.getAll("coverFile")).toHaveLength(1);
  });

  it("leaves an empty gallery and no cover out of a JSON update", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEvent());
    axiosPrivate.mockResponse("patch", makeEvent());

    await act(async () => {
      await result.current({
        eventId: "event-1",
        update: { title: "T", gallery: { files: [] } },
      });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body instanceof FormData).toBe(false);
    expect(call.body).toEqual({ title: "T" });
  });

  it("sends removeFileIds alone as a JSON array", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEvent());
    axiosPrivate.mockResponse("patch", makeEvent());

    await act(async () => {
      await result.current({
        eventId: "event-1",
        update: { removeFileIds: ["file-1", "file-2"] },
      });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body instanceof FormData).toBe(false);
    expect(call.body).toEqual({ removeFileIds: ["file-1", "file-2"] });
  });

  it("sends a Date start time as an ISO string", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEvent());
    axiosPrivate.mockResponse("patch", makeEvent());

    await act(async () => {
      await result.current({
        eventId: "event-1",
        update: { startTime: new Date("2024-06-01T10:00:00.000Z") },
      });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body).toEqual({ startTime: "2024-06-01T10:00:00.000Z" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEvent());

    axiosPrivate.mockError("patch", 500, { message: "Internal error" });

    await expect(
      result.current({ eventId: "event-1", update: { title: "New title" } }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEvent(), {
      projectId: "",
    });

    await expect(
      result.current({ eventId: "event-1", update: { title: "New title" } }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});
