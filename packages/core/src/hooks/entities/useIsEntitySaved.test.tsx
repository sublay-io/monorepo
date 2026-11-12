import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser } from "../../test-utils";
import useIsEntitySaved from "./useIsEntitySaved";

afterEach(() => {
  resetAxiosMocks();
});

describe("useIsEntitySaved", () => {
  it("checks whether an entity is saved", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useIsEntitySaved(), {
      user,
    });

    const response = { isSaved: true, collections: [{ id: "collection-1", name: "Faves" }] };
    axiosPrivate.mockResponse("get", response);

    let returned: typeof response | undefined;
    await act(async () => {
      returned = await result.current.checkIfEntityIsSaved({ entityId: "entity-1" });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/entity-1/saved");
    // The entity id is in the path, never a query param.
    expect(call.config?.params).toBeUndefined();
  });

  it("rejects when the server returns an error response", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useIsEntitySaved(), {
      user,
    });

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current.checkIfEntityIsSaved({ entityId: "entity-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when there is no authenticated user", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useIsEntitySaved(), {
      user: null,
    });

    await expect(
      result.current.checkIfEntityIsSaved({ entityId: "entity-1" }),
    ).rejects.toThrow("No user authenticated.");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("throws before making a request when no entity ID is passed", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useIsEntitySaved(), {
      user,
    });

    await expect(
      result.current.checkIfEntityIsSaved({ entityId: "" }),
    ).rejects.toThrow("No entity ID passed.");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
