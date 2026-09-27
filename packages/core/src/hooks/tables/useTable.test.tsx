import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { waitFor, act, cleanup } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
import { useTable } from "./useTable";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { baseApi } from "../../store/api/baseApi";
import { SublayContext } from "../../context/sublay-context";
import type { SublayContextValues } from "../../context/sublay-context";
import { makeRtkQueryStore } from "../../test-utils";

const ROWS = [
  { id: "1", name: "alpha" },
  { id: "2", name: "bravo" },
];
const EVENT_ROWS = ROWS;
/** Server-side Events rows for page 1, so a refetch can observe a write. */
let eventRows: typeof ROWS;
/**
 * Distinct rows per page. Without this the suite cannot tell which page is on
 * screen, and two real defects survive: pinning the grid to page 1 forever,
 * and falling back to the wrong earlier page.
 */
const PAGE_ROWS: Record<number, typeof ROWS> = {
  2: [
    { id: "p2a", name: "charlie" },
    { id: "p2b", name: "delta" },
  ],
  3: [
    { id: "p3a", name: "echo" },
    { id: "p3b", name: "foxtrot" },
  ],
};

/** A response the test releases explicitly, so "in flight" is deterministic. */
function makeGate() {
  let release!: () => void;
  const opened = new Promise<void>((resolve) => { release = resolve; });
  return { opened, release };
}

let fetchHandle: FetchMockHandle;
let gateEvents: ReturnType<typeof makeGate> | null;
let gateOrders: ReturnType<typeof makeGate> | null;
/** Counts GETs that reached the Events list handler. */
let gateEventsHits: number;

const ORDER_ROWS = [{ id: "o1", name: "order-one" }];
const page = (rows: unknown[]) => ({
  data: rows,
  pagination: { page: 1, pageSize: 20, totalPages: 1, totalItems: rows.length, hasMore: false },
});

beforeEach(() => {
  gateEvents = null;
  gateOrders = null;
  gateEventsHits = 0;
  eventRows = EVENT_ROWS;
  fetchHandle = stubFetchMock(async (...args: unknown[]) => {
    const req = args[0] as Request | string;
    const url = typeof req === "string" ? req : req.url;
    const method =
      (typeof req === "string"
        ? (args[1] as RequestInit | undefined)?.method
        : (req as Request).method) ?? "GET";

    if (method === "GET" && url.includes("/db/Orders")) {
      if (gateOrders) await gateOrders.opened;
      return jsonResponse(page(ORDER_ROWS));
    }
    if (method === "GET" && url.includes("/db/Events")) {
      gateEventsHits += 1;
      if (gateEvents) await gateEvents.opened;
    }
    if (method === "GET" && url.includes("/db/Events")) {
      const requested = Number(
        new URL(url, "http://x").searchParams.get("page") ?? 1,
      );
      const rows = PAGE_ROWS[requested] ?? eventRows;
      return jsonResponse({
        data: rows,
        pagination: {
          page: requested,
          pageSize: 20,
          totalPages: 3,
          totalItems: rows.length,
          hasMore: false,
        },
      });
    }
    if (method === "POST" && url.includes("/restore")) {
      return jsonResponse({ row: { id: "1", name: "alpha", deletedAt: null } });
    }
    if (method === "POST" && url.includes("/db/Events")) {
      return jsonResponse({ row: { id: "3", name: "charlie" } }, 201);
    }
    if (method === "PATCH" && url.includes("/db/Events/1")) {
      return jsonResponse({ row: { id: "1", name: "updated" } });
    }
    if (method === "DELETE" && url.includes("/db/Events/1")) {
      return jsonResponse({ deleted: true, soft: !url.includes("force=true") });
    }
    return jsonResponse({}, 404);
  });
});

afterEach(() => {
  gateEvents?.release();
  gateOrders?.release();
  cleanup();
  unstubFetchMock();
});

describe("useTable", () => {
  it("loads rows from the /db surface", async () => {
    const { result } = renderHookWithStore(() => useTable("Events"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows.map((r) => r.id)).toEqual(["1", "2"]);
    expect(result.current.pagination?.totalItems).toBe(2);

    // The GET hit the logical-name /db route.
    const getCall = fetchHandle
      .calls()
      .find((c) => c.url.includes("/test-project/db/Events"));
    expect(getCall).toBeTruthy();
  });

  it("createRow issues a POST and returns the new row", async () => {
    const { result } = renderHookWithStore(() => useTable("Events"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: { id: string } | undefined;
    await act(async () => {
      created = await result.current.createRow({ name: "charlie" });
    });
    expect(created?.id).toBe("3");

    const postCall = fetchHandle.calls().find((c) => c.method === "POST");
    expect(postCall).toBeTruthy();
  });

  it("exposes view controls that update the slice", async () => {
    const { result } = renderHookWithStore(() => useTable("Events"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setIncludeDeleted(true));
    await waitFor(() =>
      expect(result.current.view.includeDeleted).toBe(true),
    );
    expect(result.current.view.page).toBe(1);
  });

  it("setPage updates the page without resetting other view state", async () => {
    const { result } = renderHookWithStore(() => useTable("Events"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setFilters([{ column: "name", operator: "eq", value: "alpha" }]));
    await waitFor(() => expect(result.current.view.filters).toHaveLength(1));

    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.view.page).toBe(3));
    expect(result.current.view.filters).toHaveLength(1);
  });

  it("setSort resets the page to 1", async () => {
    const { result } = renderHookWithStore(() => useTable("Events"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(5));
    await waitFor(() => expect(result.current.view.page).toBe(5));

    act(() => result.current.setSort("name", "desc"));
    await waitFor(() => expect(result.current.view.sortBy).toBe("name"));
    expect(result.current.view.sortDir).toBe("desc");
    expect(result.current.view.page).toBe(1);
  });

  it("updateRow issues a PATCH and returns the updated row", async () => {
    const { result } = renderHookWithStore(() =>
      useTable<{ id: string; name: string }>("Events"),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    let updated: { id: string; name: string } | undefined;
    await act(async () => {
      updated = await result.current.updateRow("1", { name: "updated" });
    });
    expect(updated?.name).toBe("updated");

    const patchCall = fetchHandle.calls().find((c) => c.method === "PATCH");
    expect(patchCall?.url).toContain("/db/Events/1");
  });

  it("deleteRow issues a DELETE and reports soft-delete by default", async () => {
    const { result } = renderHookWithStore(() => useTable("Events"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let outcome: { deleted: boolean; soft: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.deleteRow("1");
    });
    expect(outcome).toEqual({ deleted: true, soft: true });

    const deleteCall = fetchHandle.calls().find((c) => c.method === "DELETE");
    expect(deleteCall?.url).toContain("/db/Events/1");
  });

  it("deleteRow forwards force:true through to the request", async () => {
    const { result } = renderHookWithStore(() => useTable("Events"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteRow("1", { force: true });
    });

    const deleteCall = fetchHandle.calls().find((c) => c.method === "DELETE");
    expect(deleteCall?.url).toContain("force=true");
  });

  it("restoreRow issues a POST to the row's /restore route", async () => {
    const { result } = renderHookWithStore(() =>
      useTable<{ id: string; deletedAt: string | null }>("Events"),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    let restored: { id: string; deletedAt: string | null } | undefined;
    await act(async () => {
      restored = await result.current.restoreRow("1");
    });
    expect(restored?.deletedAt).toBeNull();

    const restoreCall = fetchHandle.calls().find((c) => c.url.includes("/restore"));
    expect(restoreCall?.method).toBe("POST");
  });

  it("surfaces a fetch error instead of throwing", async () => {
    fetchHandle.fetchMock.mockImplementationOnce(async () =>
      jsonResponse({ message: "server error" }, 500),
    );
    const { result } = renderHookWithStore(() => useTable("Events"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it("createRow rejects when the request fails", async () => {
    const { result } = renderHookWithStore(() => useTable("Events"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchHandle.fetchMock.mockImplementationOnce(async () =>
      jsonResponse({ message: "invalid" }, 400),
    );

    await expect(
      act(async () => {
        await result.current.createRow({ name: "broken" });
      }),
    ).rejects.toBeTruthy();
  });
  describe("changing the identifier vs changing the view", () => {
    it("does not show another table's rows when tableName changes", async () => {
      const gate = makeGate();
      gateOrders = gate;

      const { result, rerender } = renderHookWithStore(
        ({ name }: { name: string }) => useTable(name),
        { initialProps: { name: "Events" } },
      );

      await waitFor(() => expect(result.current.rows).toHaveLength(2));
      expect(result.current.rows.map((r) => r.id)).toEqual(["1", "2"]);

      rerender({ name: "Orders" });

      // Deterministically mid-flight: Orders is gated open. The Events rows
      // must be gone — they are a different table's data, not stale data.
      expect(result.current.rows).toEqual([]);
      expect(result.current.loading).toBe(true);

      gate.release();
      await waitFor(() =>
        expect(result.current.rows.map((r) => r.id)).toEqual(["o1"]),
      );
      expect(result.current.loading).toBe(false);
    });

    it("keeps the previous page on screen while a new page loads", async () => {
      const { result } = renderHookWithStore(() => useTable("Events"));
      await waitFor(() => expect(result.current.rows).toHaveLength(2));

      const gate = makeGate();
      gateEvents = gate;
      act(() => result.current.setPage(2));

      // Same table: blanking the grid on every page click is worse than a
      // moment of staleness, so page 1 stays and loading is false.
      await waitFor(() => expect(gateEventsHits).toBeGreaterThan(1));
      expect(result.current.rows.map((r) => r.id)).toEqual(["1", "2"]);
      expect(result.current.pagination?.page).toBe(1);
      expect(result.current.loading).toBe(false);

      gate.release();

      // ...and page 2 must actually replace it. Asserting the new ids, not
      // just a row count, is what stops the grid pinning to page 1 forever.
      await waitFor(() =>
        expect(result.current.rows.map((r) => r.id)).toEqual(["p2a", "p2b"]),
      );
      expect(result.current.pagination?.page).toBe(2);
    });

    it("falls back to the page it was last showing, not an earlier one", async () => {
      const { result } = renderHookWithStore(() => useTable("Events"));
      await waitFor(() => expect(result.current.rows).toHaveLength(2));

      act(() => result.current.setPage(2));
      await waitFor(() =>
        expect(result.current.rows.map((r) => r.id)).toEqual(["p2a", "p2b"]),
      );

      const gate = makeGate();
      gateEvents = gate;
      act(() => result.current.setPage(3));
      await waitFor(() => expect(gateEventsHits).toBeGreaterThan(2));

      // While page 3 loads the user must see page 2 — the page they were
      // actually on — not whichever page happened to load first.
      expect(result.current.rows.map((r) => r.id)).toEqual(["p2a", "p2b"]);
      gate.release();
      await waitFor(() =>
        expect(result.current.rows.map((r) => r.id)).toEqual(["p3a", "p3b"]),
      );
    });

    it("re-queries when any view knob changes, not just the page", async () => {
      // Every field of the query arg must reach the request. Dropping any one
      // of them from the arg leaves the query on the old parameters — and for
      // setFilters/setSort, which also reset to page 1, nothing at all would
      // change when you are already on page 1.
      const { result } = renderHookWithStore(() => useTable("Events"));
      await waitFor(() => expect(result.current.rows).toHaveLength(2));

      const lastUrl = () =>
        fetchHandle
          .calls()
          .filter((c) => c.method === "GET" && c.url.includes("/db/Events"))
          .slice(-1)[0].url;

      act(() => result.current.setFilters([{ column: "name", operator: "eq", value: "x" }]));
      await waitFor(() => expect(lastUrl()).toContain("filters="));

      act(() => result.current.setSort("name", "desc"));
      await waitFor(() => expect(lastUrl()).toContain("sortBy=name"));
      expect(lastUrl()).toContain("sortDir=desc");

      act(() => result.current.setIncludeDeleted(true));
      await waitFor(() => expect(lastUrl()).toContain("includeDeleted=true"));

      act(() => result.current.setView({ limit: 5 }));
      await waitFor(() => expect(lastUrl()).toContain("limit=5"));
    });

    it("shows fresh rows once a revalidation lands", async () => {
      // A revalidation must reach the screen: the returned value has to
      // recompute when the query result changes, not only when the caller
      // changes the view.
      const { result } = renderHookWithStore(() => useTable("Events"));
      await waitFor(() => expect(result.current.rows).toHaveLength(2));

      eventRows = [...EVENT_ROWS, { id: "3", name: "charlie" }];
      await result.current.createRow({ name: "charlie" });

      await waitFor(() => expect(result.current.rows).toHaveLength(3));
      expect(result.current.rows.map((r) => r.id)).toEqual(["1", "2", "3"]);
    });

    it("drops the rows when the API cache is reset", async () => {
      // Sign-out and account switch both dispatch resetApiState(). A fallback
      // held outside the cache would survive it and serve the previous
      // session's rows.
      const store = makeRtkQueryStore();
      const { result } = renderHookWithStore(() => useTable("Events"), {
        store,
      });
      await waitFor(() => expect(result.current.rows).toHaveLength(2));

      act(() => {
        store.dispatch(baseApi.util.resetApiState());
      });

      expect(result.current.rows).toEqual([]);
    });

    it("does not show another project's rows when projectId changes", async () => {
      // Changing project is NOT a supported flow — an app stays on one
      // project. This covers the invariant, not a feature: the fallback must
      // never outlive the identity of the data it came from. The harness
      // fixes projectId at mount, hence the local wrapper.
      const store = makeRtkQueryStore();
      let pid = "project-a";
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <SublayContext.Provider
            value={{ projectId: pid, project: null } as SublayContextValues}
          >
            {children}
          </SublayContext.Provider>
        </Provider>
      );

      const { result, rerender } = renderHook(() => useTable("Events"), {
        wrapper,
      });
      await waitFor(() => expect(result.current.rows).toHaveLength(2));

      const gate = makeGate();
      gateEvents = gate;
      pid = "project-b";
      rerender();

      // Same table name, different project: still a different dataset, so the
      // previous project's rows must not be served while the new one loads.
      expect(result.current.rows).toEqual([]);
      expect(result.current.loading).toBe(true);

      gate.release();
      await waitFor(() => expect(result.current.rows).toHaveLength(2));
      expect(result.current.loading).toBe(false);
    });
  });
});
