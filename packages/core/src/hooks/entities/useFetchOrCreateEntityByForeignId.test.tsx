import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import useFetchOrCreateEntityByForeignId, {
  FetchOrCreateEntityByForeignIdResult,
} from "./useFetchOrCreateEntityByForeignId";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchOrCreateEntityByForeignId", () => {
  it("sends createIfNotFound=true to /entities/by-foreign-id", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchOrCreateEntityByForeignId(),
    );

    axiosPrivate.mockResponse("get", makeEntity({ foreignId: "ext-1" }));

    await act(async () => {
      await result.current({ foreignId: "ext-1", include: ["user", "space"] });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/by-foreign-id");
    expect(call.config?.params).toMatchObject({
      foreignId: "ext-1",
      createIfNotFound: true,
      include: "user,space",
    });
  });

  it("resolves to { entity, created: true } when the server answers 201", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchOrCreateEntityByForeignId(),
    );

    const entity = makeEntity({ foreignId: "ext-1" });
    axiosPrivate.mockResponse("get", entity, 201);

    let returned: FetchOrCreateEntityByForeignIdResult | undefined;
    await act(async () => {
      returned = await result.current({ foreignId: "ext-1" });
    });

    expect(returned).toEqual({ entity, created: true });
  });

  it("resolves to { entity, created: false } when the server answers 200", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchOrCreateEntityByForeignId(),
    );

    const entity = makeEntity({ foreignId: "ext-1" });
    axiosPrivate.mockResponse("get", entity, 200);

    let returned: FetchOrCreateEntityByForeignIdResult | undefined;
    await act(async () => {
      returned = await result.current({ foreignId: "ext-1" });
    });

    expect(returned).toEqual({ entity, created: false });
  });

  it("throws before making a request when no foreign ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchOrCreateEntityByForeignId(),
    );

    await expect(result.current({ foreignId: "" })).rejects.toThrow(
      "Please pass foreignId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
