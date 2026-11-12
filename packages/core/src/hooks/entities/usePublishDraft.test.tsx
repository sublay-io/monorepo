import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import usePublishDraft from "./usePublishDraft";

afterEach(() => {
  resetAxiosMocks();
});

describe("usePublishDraft", () => {
  it("publishes a draft entity", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => usePublishDraft());

    const published = makeEntity({ isDraft: false });
    axiosPrivate.mockResponse("post", published);

    let returned: typeof published | undefined;
    await act(async () => {
      returned = await result.current({ entityId: "entity-1" });
    });

    expect(returned).toEqual(published);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/entities/entity-1/publish");
    expect(call.body).toEqual({});
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => usePublishDraft());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(
      result.current({ entityId: "entity-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no entity ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => usePublishDraft());

    await expect(result.current({ entityId: "" })).rejects.toThrow(
      "No entityId provided.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => usePublishDraft(), {
      projectId: "",
    });

    await expect(result.current({ entityId: "entity-1" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});
