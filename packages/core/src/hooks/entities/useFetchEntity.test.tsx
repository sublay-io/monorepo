import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import useFetchEntity from "./useFetchEntity";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchEntity", () => {
  it("fetches an entity by ID", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEntity());

    const entity = makeEntity();
    axiosPrivate.mockResponse("get", entity);

    let returned: typeof entity | undefined;
    await act(async () => {
      returned = await result.current({ entityId: "entity-1" });
    });

    expect(returned).toEqual(entity);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/entity-1");
  });

  it("joins an include array into a comma-separated param", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEntity());

    axiosPrivate.mockResponse("get", makeEntity());

    await act(async () => {
      await result.current({ entityId: "entity-1", include: ["user", "space"] });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({ include: "user,space" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEntity());

    axiosPrivate.mockError("get", 404, { message: "Not found" });

    await expect(
      result.current({ entityId: "entity-1" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws before making a request when no entity ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEntity());

    await expect(result.current({ entityId: "" })).rejects.toThrow(
      "Please pass an entityId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEntity(), {
      projectId: "",
    });

    await expect(result.current({ entityId: "entity-1" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
