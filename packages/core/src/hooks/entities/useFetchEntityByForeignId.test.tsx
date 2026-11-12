import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import useFetchEntityByForeignId from "./useFetchEntityByForeignId";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchEntityByForeignId", () => {
  it("fetches an entity by foreign ID", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchEntityByForeignId(),
    );

    const entity = makeEntity({ foreignId: "ext-1" });
    axiosPrivate.mockResponse("get", entity);

    let returned: typeof entity | undefined;
    await act(async () => {
      returned = await result.current({ foreignId: "ext-1" });
    });

    expect(returned).toEqual(entity);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/by-foreign-id");
    expect(call.config?.params).toMatchObject({ foreignId: "ext-1" });
  });

  it("never asks the server to create", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchEntityByForeignId(),
    );

    axiosPrivate.mockResponse("get", makeEntity());

    await act(async () => {
      await result.current({ foreignId: "ext-1" });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params?.createIfNotFound).toBeUndefined();
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchEntityByForeignId(),
    );

    axiosPrivate.mockError("get", 404, { message: "Not found" });

    await expect(
      result.current({ foreignId: "ext-1" }),
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("throws before making a request when no foreign ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchEntityByForeignId(),
    );

    await expect(result.current({ foreignId: "" })).rejects.toThrow(
      "Please pass foreignId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
