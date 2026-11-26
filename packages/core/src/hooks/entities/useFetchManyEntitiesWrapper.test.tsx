import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeEntity,
  okAxiosResponse,
} from "../../test-utils";
import { axiosPrivate as axiosPrivateInstance } from "../../config/axios";
import useFetchManyEntitiesWrapper from "./useFetchManyEntitiesWrapper";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Entity } from "../../interfaces/models/Entity";

afterEach(() => {
  resetAxiosMocks();
  vi.restoreAllMocks();
});

/** The next GET waits until the returned function is called with its page. */
function holdNextGet(): (page: PaginatedResponse<Entity>) => Promise<void> {
  let release!: (value: unknown) => void;
  // The harness has already replaced `get` with its recording spy.
  vi.mocked(axiosPrivateInstance.get).mockImplementationOnce(
    () => new Promise((resolve) => { release = resolve; }) as never,
  );
  return async (page) => {
    await act(async () => {
      release(okAxiosResponse(page, 200));
      await new Promise((r) => setTimeout(r, 10));
    });
  };
}

function makePage(entities: Entity[], hasMore: boolean): PaginatedResponse<Entity> {
  return {
    data: entities,
    pagination: {
      page: 1,
      pageSize: 10,
      totalPages: hasMore ? 2 : 1,
      totalItems: entities.length,
      hasMore,
    },
  };
}

describe("useFetchManyEntitiesWrapper", () => {
  it("fetches the first page on mount and loads more on demand", async () => {
    const firstEntity = makeEntity({ id: "entity-1" });
    const secondEntity = makeEntity({ id: "entity-2" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyEntitiesWrapper({}),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([firstEntity], true)),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entities).toEqual([firstEntity]);
    expect(result.current.hasMore).toBe(true);

    axiosPrivate.mockResponse("get", makePage([secondEntity], false));

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(result.current.entities).toEqual([firstEntity, secondEntity]);

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(2);
    expect(calls[0].config?.params).toMatchObject({ page: 1 });
    expect(calls[1].config?.params).toMatchObject({ page: 2 });
  });

  it("forwards the spaceReputation OBJECT form as flat params on BOTH page 1 and load-more", async () => {
    // Regression guard: a load-more path that drops the `spaceReputation`
    // object gives correct reputation on page 1 then a silent no-op on every
    // load-more page. Exercise the real load-more flow and assert page 2
    // carries the same flat `spaceReputationId`/`spaceReputationDescendants`
    // the object flattens to — never dropped, never bracketed.
    const firstEntity = makeEntity({ id: "entity-1" });
    const secondEntity = makeEntity({ id: "entity-2" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useFetchManyEntitiesWrapper({
          spaceReputation: { spaceId: "space-7", includeDescendants: true },
        }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([firstEntity], true)),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", makePage([secondEntity], false));

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.hasMore).toBe(false));

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(2);

    const expectFlatReputation = (params: Record<string, unknown> | undefined) => {
      expect(params).toMatchObject({
        spaceReputationId: "space-7",
        spaceReputationDescendants: true,
      });
      // The object must NOT survive into the serialized params (bracket-leak /
      // `[object Object]` would silently no-op on the server).
      expect(params).not.toHaveProperty("spaceReputation");
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).map(([k, v]) => [k, String(v)]),
      ).toString();
      expect(qs).toContain("spaceReputationId=space-7");
      expect(qs).not.toContain("spaceReputation%5B");
      expect(qs).not.toContain("spaceReputation[");
    };

    // Page 1 (reset path) and page 2 (load-more path) must be identical.
    expect(calls[0].config?.params).toMatchObject({ page: 1 });
    expectFlatReputation(calls[0].config?.params as Record<string, unknown>);
    expect(calls[1].config?.params).toMatchObject({ page: 2 });
    expectFlatReputation(calls[1].config?.params as Record<string, unknown>);
  });

  it("resets to page 1 and refetches when the sort options change", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyEntitiesWrapper({}),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeEntity()], false)),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", makePage([], false));

    act(() => {
      result.current.setSortBy("top");
    });

    await waitFor(() => expect(result.current.sortBy).toBe("top"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const calls = axiosPrivate.calls("get");
    const lastCall = calls[calls.length - 1];
    expect(lastCall.config?.params).toMatchObject({ page: 1, sortBy: "top" });
  });

  it("stops loading without throwing when the request fails", async () => {
    const { result } = renderHookWithAxios(() => useFetchManyEntitiesWrapper({}), {
      beforeRender: ({ axiosPrivate }) =>
        axiosPrivate.mockError("get", 500, { message: "Internal error" }),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entities).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("drops a page that lands after the filters changed", async () => {
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (p: { userId: string }) => useFetchManyEntitiesWrapper(p),
      {
        initialProps: { userId: "user-a" },
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "a1" })], true)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Page 2 for user-a is in flight when the filter changes.
    const releasePage2 = holdNextGet();
    act(() => {
      result.current.loadMore();
    });
    axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "b1" })], false));
    rerender({ userId: "user-b" });
    await waitFor(() => expect(result.current.entities.map((e) => e.id)).toEqual(["b1"]));

    await releasePage2(makePage([makeEntity({ id: "a2" })], false));
    expect(result.current.entities.map((e) => e.id)).toEqual(["b1"]);
    expect(result.current.loading).toBe(false);

    const calls = axiosPrivate.calls("get");
    expect(calls[2].config?.params).toMatchObject({ page: 1, userId: "user-b" });
  });

  it("retries a failed first page as page 1, through loadMore", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyEntitiesWrapper({}), {
      beforeRender: ({ axiosPrivate }) => axiosPrivate.mockError("get", 500, { message: "boom" }),
    });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.loading).toBe(false);
    // `hasMore` says there's something for loadMore to do: the failed page.
    expect(result.current.hasMore).toBe(true);

    axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "e1" })], true));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.entities.map((e) => e.id)).toEqual(["e1"]);

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(2);
    expect(calls[1].config?.params).toMatchObject({ page: 1 });
  });

  it("advances exactly one page on two loadMore calls in the same tick", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyEntitiesWrapper({}), {
      beforeRender: ({ axiosPrivate }) =>
        axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "e1" })], true)),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "e2" })], true));
    axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "e3" })], false));
    await act(async () => {
      await Promise.all([result.current.loadMore(), result.current.loadMore()]);
    });
    expect(result.current.entities.map((e) => e.id)).toEqual(["e1", "e2"]);
    expect(axiosPrivate.calls("get").map((c) => c.config?.params?.page)).toEqual([1, 2]);

    await act(async () => {
      await result.current.loadMore();
    });
    expect(axiosPrivate.calls("get").map((c) => c.config?.params?.page)).toEqual([1, 2, 3]);
  });

  it("refetch reloads page 1 with the current filters and sort", async () => {
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (p: { sourceId: string }) =>
        useFetchManyEntitiesWrapper({ ...p, titleFilters: { includes: ["x"] } }),
      {
        initialProps: { sourceId: "src-1" },
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "e1" })], true)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "e2" })], true));
    await act(async () => {
      await result.current.loadMore();
    });
    axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "t1" })], true));
    act(() => result.current.setSortBy("top"));
    await waitFor(() => expect(result.current.entities.map((e) => e.id)).toEqual(["t1"]));

    axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "t1-new" })], false));
    rerender({ sourceId: "src-1" });
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.entities.map((e) => e.id)).toEqual(["t1-new"]);

    const calls = axiosPrivate.calls("get");
    const last = calls[calls.length - 1].config?.params;
    expect(calls).toHaveLength(4);
    expect(last).toMatchObject({ page: 1, sortBy: "top", sourceId: "src-1" });
    expect(JSON.stringify(last)).toContain("x");
  });

  it("loadMore and refetch never reject", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyEntitiesWrapper({}), {
      beforeRender: ({ axiosPrivate }) =>
        axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "e1" })], true)),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockError("get", 500);
    await expect(result.current.loadMore()).resolves.toBeUndefined();
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));

    axiosPrivate.mockNetworkError("get");
    await expect(result.current.refetch()).resolves.toBeUndefined();
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.loading).toBe(false);
    expect(result.current.entities.map((e) => e.id)).toEqual(["e1"]);
  });

  it("sends blockedFilter on load-more pages as well as page 1", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyEntitiesWrapper({ blockedFilter: "include-outbound-blocked" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "entity-1" })], true)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", makePage([makeEntity({ id: "entity-2" })], false));
    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.hasMore).toBe(false));

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(2);
    expect(calls[0].config?.params).toMatchObject({ page: 1, blockedFilter: "include-outbound-blocked" });
    expect(calls[1].config?.params).toMatchObject({ page: 2, blockedFilter: "include-outbound-blocked" });
  });

  // REGRESSION: an inline `include` array is a fresh reference every render.
  // Held raw in the reset/load-more deps it re-fired the fetch effect forever.
  // The hook depends on a flattened key, so equal arrays must not refetch.
  it("does not refetch when re-rendered with an equal inline array include", async () => {
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyEntitiesWrapper({ include: ["user", "space"] }),
      {
        beforeRender: ({ axiosPrivate }) => {
          for (let i = 0; i < 10; i += 1) {
            axiosPrivate.mockResponse("get", makePage([], false));
          }
        },
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    for (let i = 0; i < 5; i += 1) rerender();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(1);
    expect(calls[0].config?.params).toMatchObject({ include: "user,space" });
  });

  it("refetches when include really changes", async () => {
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: { include: ("user" | "space" | "files")[] }) =>
        useFetchManyEntitiesWrapper({ include: props.include }),
      {
        initialProps: { include: ["user", "space"] },
        beforeRender: ({ axiosPrivate }) => {
          for (let i = 0; i < 10; i += 1) {
            axiosPrivate.mockResponse("get", makePage([], false));
          }
        },
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ include: ["user", "files"] });
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(2);
    expect(calls[1].config?.params).toMatchObject({ include: "user,files" });
  });

  // REGRESSION (#202): inline filter objects are fresh references every render,
  // the same loop as `include` above. The hook depends on their serialized form.
  it("does not refetch when re-rendered with equal inline filter objects", async () => {
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      () =>
        useFetchManyEntitiesWrapper({
          titleFilters: { hasTitle: true, includes: ["launch"] },
          metadataFilters: { includes: { color: "red" } },
        }),
      {
        beforeRender: ({ axiosPrivate }) => {
          for (let i = 0; i < 10; i += 1) {
            axiosPrivate.mockResponse("get", makePage([], false));
          }
        },
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    for (let i = 0; i < 5; i += 1) rerender();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("refetches when a filter object really changes", async () => {
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: { color: string }) =>
        useFetchManyEntitiesWrapper({ metadataFilters: { includes: { color: props.color } } }),
      {
        initialProps: { color: "red" },
        beforeRender: ({ axiosPrivate }) => {
          for (let i = 0; i < 10; i += 1) {
            axiosPrivate.mockResponse("get", makePage([], false));
          }
        },
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ color: "blue" });
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(2);
    expect(JSON.stringify(calls[1].config?.params)).toContain("blue");
  });
});
