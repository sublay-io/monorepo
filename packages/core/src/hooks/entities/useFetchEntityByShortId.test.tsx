import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import useFetchEntityByShortId from "./useFetchEntityByShortId";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchEntityByShortId", () => {
  it("fetches an entity by short ID", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchEntityByShortId(),
    );

    const entity = makeEntity({ shortId: "short-1" });
    axiosPrivate.mockResponse("get", entity);

    let returned: typeof entity | undefined;
    await act(async () => {
      returned = await result.current({ shortId: "short-1" });
    });

    expect(returned).toEqual(entity);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/by-short-id");
    expect(call.config?.params).toMatchObject({ shortId: "short-1" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchEntityByShortId(),
    );

    axiosPrivate.mockError("get", 404, { message: "Not found" });

    await expect(
      result.current({ shortId: "short-1" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws before making a request when no short ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchEntityByShortId(),
    );

    await expect(result.current({ shortId: "" })).rejects.toThrow(
      "Please pass shortId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
