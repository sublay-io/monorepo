import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import useFetchManyEntitiesWrapper from "./useFetchManyEntitiesWrapper";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Entity } from "../../interfaces/models/Entity";

afterEach(() => {
  resetAxiosMocks();
});

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
    // Regression guard: the load-more path previously forwarded only the
    // deprecated flat props and dropped the new `spaceReputation` object, so a
    // caller on the object form got correct reputation on page 1 then a silent
    // no-op on every load-more page. Exercise the real load-more flow and assert
    // page 2 carries the same flat `spaceReputationId`/`spaceReputationDescendants`
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
});
