import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useCreateEvent from "./useCreateEvent";

afterEach(() => {
  resetAxiosMocks();
});

describe("useCreateEvent", () => {
  it("creates an event via a plain JSON request when there is no cover/gallery", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateEvent());

    const created = makeEvent({ title: "Launch party" });
    axiosPrivate.mockResponse("post", created, 201);

    let returned: typeof created | undefined;
    await act(async () => {
      returned = await result.current({
        title: "Launch party",
        startTime: "2024-06-01T00:00:00.000Z",
        type: "online",
      });
    });

    expect(returned).toEqual(created);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/events");
    expect(call.body).toMatchObject({ title: "Launch party", type: "online" });
    expect(call.body instanceof FormData).toBe(false);
  });

  it("creates an event via multipart FormData when a cover image is provided", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateEvent());

    const created = makeEvent({ title: "With cover" });
    axiosPrivate.mockResponse("post", created, 201);

    const file = new File(["binary"], "cover.png", { type: "image/png" });

    await act(async () => {
      await result.current({
        title: "With cover",
        startTime: "2024-06-01T00:00:00.000Z",
        type: "online",
        cover: { file, options: { mode: "original-aspect", sizes: { full: 1200 } } },
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body instanceof FormData).toBe(true);
    const formData = call.body as FormData;
    expect(formData.get("title")).toBe("With cover");
    expect(formData.get("cover")).toBeInstanceOf(File);
    expect(formData.get("cover.options")).toBe(
      JSON.stringify({ mode: "original-aspect", sizes: { full: 1200 } }),
    );
    expect(call.config?.headers).toMatchObject({
      "Content-Type": "multipart/form-data",
    });
  });

  it("sends Date start and end times as ISO strings, as JSON and as multipart", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateEvent());
    axiosPrivate.mockResponse("post", makeEvent(), 201);
    axiosPrivate.mockResponse("post", makeEvent(), 201);

    const startTime = new Date("2024-06-01T10:00:00.000Z");
    const endTime = new Date("2024-06-01T12:00:00.000Z");

    await act(async () => {
      await result.current({ title: "Dated", startTime, endTime, type: "online" });
    });
    await act(async () => {
      await result.current({
        title: "Dated",
        startTime,
        endTime,
        type: "online",
        cover: {
          file: new File(["binary"], "cover.png", { type: "image/png" }),
        },
      });
    });

    const [jsonCall, multipartCall] = axiosPrivate.calls("post");
    expect(jsonCall.body).toMatchObject({
      startTime: "2024-06-01T10:00:00.000Z",
      endTime: "2024-06-01T12:00:00.000Z",
    });
    const formData = multipartCall.body as FormData;
    expect(formData.get("startTime")).toBe("2024-06-01T10:00:00.000Z");
    expect(formData.get("endTime")).toBe("2024-06-01T12:00:00.000Z");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateEvent());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(
      result.current({
        title: "Launch party",
        startTime: "2024-06-01T00:00:00.000Z",
        type: "online",
      }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateEvent(), {
      projectId: "",
    });

    await expect(
      result.current({
        title: "Launch party",
        startTime: "2024-06-01T00:00:00.000Z",
        type: "online",
      }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});
