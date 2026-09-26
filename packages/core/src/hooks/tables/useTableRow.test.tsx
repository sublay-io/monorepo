import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { waitFor, cleanup } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
import { useTableRow } from "./useTableRow";
import { useTable } from "./useTable";

// Real UUIDs — the server validates `rowId` with `uuidSchema`, so fixtures like
// "1" would really be a 400, never the 200/404 these mocks return.
const ID_A = "3f0d9f2e-1c4a-4b7e-9f11-0a2b3c4d5e6f";
const ID_B = "7a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d";
const ID_GONE = "9e8d7c6b-5a49-4382-9170-6f5e4d3c2b1a";

const ROW_A = { id: ID_A, name: "alpha" };
const ROW_B = { id: ID_B, name: "bravo" };

/**
 * A response the test releases explicitly. A timer-based delay makes every
 * in-flight assertion a wall-clock race: the window can close before the
 * assertion runs, which both invites flakes and lets mutations survive. A gate
 * turns "while the request is in flight" into a deterministic state.
 */
function makeGate() {
  let release!: () => void;
  const opened = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { opened, release };
}

let fetchHandle: FetchMockHandle;

/** Set to hold the next GET for that row open until released. */
let gateA: ReturnType<typeof makeGate> | null;
let gateB: ReturnType<typeof makeGate> | null;
/** Incremented when a GET for ID_A *starts*, so a test can wait for entry. */
let startsA: number;

let rowAStatus: "ok" | "gone" | "server-error" | "bad-request";
/** Server-side name for ID_A, so a PATCH is visible to a later GET. */
let rowAName: string;

beforeEach(() => {
  gateA = null;
  gateB = null;
  startsA = 0;
  rowAStatus = "ok";
  rowAName = "alpha";

  fetchHandle = stubFetchMock(async (...args: unknown[]) => {
    const req = args[0] as Request | string;
    const url = typeof req === "string" ? req : req.url;
    const method =
      (typeof req === "string"
        ? (args[1] as RequestInit | undefined)?.method
        : (req as Request).method) ?? "GET";

    if (method === "GET" && url.endsWith(`/db/Events/${ID_A}`)) {
      startsA += 1;
      if (gateA) await gateA.opened;
      if (rowAStatus === "gone") {
        return jsonResponse(
          { error: "Not Found", code: "database/row-not-found" },
          404,
        );
      }
      if (rowAStatus === "server-error") {
        return jsonResponse({ error: "Internal Server Error" }, 500);
      }
      if (rowAStatus === "bad-request") {
        return jsonResponse(
          { error: "Bad Request", code: "database/invalid-params" },
          400,
        );
      }
      return jsonResponse({ row: { ...ROW_A, name: rowAName } });
    }
    if (method === "GET" && url.endsWith(`/db/Events/${ID_B}`)) {
      if (gateB) await gateB.opened;
      return jsonResponse({ row: ROW_B });
    }
    if (method === "GET" && url.endsWith(`/db/Events/${ID_GONE}`)) {
      return jsonResponse(
        { error: "Not Found", code: "database/row-not-found" },
        404,
      );
    }
    if (method === "PATCH" && url.endsWith(`/db/Events/${ID_B}`)) {
      return jsonResponse({ row: ROW_B });
    }
    if (method === "DELETE" && url.endsWith(`/db/Events/${ID_A}`)) {
      return jsonResponse({ deleted: true, soft: false });
    }
    if (method === "PATCH" && url.endsWith(`/db/Events/${ID_A}`)) {
      rowAName = "renamed";
      return jsonResponse({ row: { ...ROW_A, name: rowAName } });
    }
    if (method === "GET" && url.includes("/db/Events")) {
      return jsonResponse({
        data: [ROW_A],
        pagination: {
          page: 1,
          pageSize: 20,
          totalPages: 1,
          totalItems: 1,
          hasMore: false,
        },
      });
    }
    return jsonResponse({}, 404);
  });
});

afterEach(() => {
  // Never leave a gated request hanging into the next test.
  gateA?.release();
  gateB?.release();
  cleanup();
  unstubFetchMock();
});

const getsForA = () =>
  fetchHandle
    .calls()
    .filter((c) => c.method === "GET" && c.url.endsWith(`/db/Events/${ID_A}`))
    .length;

describe("useTableRow", () => {
  it("loads a single row from the exact /db single-row route", async () => {
    const { result } = renderHookWithStore(() => useTableRow("Events", ID_A));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.row).toEqual(ROW_A);
    expect(result.current.error).toBeFalsy();

    // Full-URL equality, not a substring: a substring cannot catch an extra or
    // reordered path segment, which is the failure mode that has shipped here
    // before.
    expect(fetchHandle.calls()[0].url).toBe(
      `https://api.sublay.io/v7/test-project/db/Events/${ID_A}`,
    );
  });

  describe("skipping", () => {
    it("skips until rowId is present, then loads", async () => {
      const { result, rerender } = renderHookWithStore(
        ({ id }: { id: string | null }) => useTableRow("Events", id),
        { initialProps: { id: null as string | null } },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.row).toBeNull();
      expect(getsForA()).toBe(0);

      rerender({ id: ID_A });
      await waitFor(() => expect(result.current.row).toEqual(ROW_A));
    });

    it("skips on an undefined rowId, not just null", async () => {
      const { result } = renderHookWithStore(() =>
        useTableRow("Events", undefined),
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.row).toBeNull();
      await new Promise((r) => setTimeout(r, 20));
      expect(getsForA()).toBe(0);
    });

    it("skips while the project has no id", async () => {
      // Omitting `projectId` re-applies the harness default, so it has to be
      // explicitly falsy to exercise this branch.
      const { result } = renderHookWithStore(
        () => useTableRow("Events", ID_A),
        { projectId: "" },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.row).toBeNull();
      await new Promise((r) => setTimeout(r, 20));
      expect(getsForA()).toBe(0);
    });

    it("clears the row when rowId goes back to null", async () => {
      const { result, rerender } = renderHookWithStore(
        ({ id }: { id: string | null }) => useTableRow("Events", id),
        { initialProps: { id: ID_A as string | null } },
      );

      await waitFor(() => expect(result.current.row).toEqual(ROW_A));

      rerender({ id: null });

      expect(result.current.row).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it("does not serve the previous row while a new rowId is in flight", async () => {
    gateB = makeGate();
    const { result, rerender } = renderHookWithStore(
      ({ id }: { id: string }) => useTableRow("Events", id),
      { initialProps: { id: ID_A } },
    );

    await waitFor(() => expect(result.current.row).toEqual(ROW_A));

    rerender({ id: ID_B });

    // Deterministically mid-flight: B is gated open.
    expect(result.current.row).toBeNull();
    expect(result.current.loading).toBe(true);

    gateB.release();
    await waitFor(() => expect(result.current.row).toEqual(ROW_B));
    expect(result.current.loading).toBe(false);
  });

  describe("failure handling", () => {
    it("surfaces a cold 404 as error, not as a row", async () => {
      const { result } = renderHookWithStore(() =>
        useTableRow("Events", ID_GONE),
      );

      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect(result.current.row).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("drops the stale row when a refetch of a loaded row 404s", async () => {
      const { result } = renderHookWithStore(() => useTableRow("Events", ID_A));

      await waitFor(() => expect(result.current.row).toEqual(ROW_A));

      rowAStatus = "gone";
      result.current.refetch();

      await waitFor(() => expect(result.current.error).toBeTruthy());
      // Must not keep rendering a record the server says is gone.
      expect(result.current.row).toBeNull();
    });

    it("keeps the last good row when a refetch fails with a 500", async () => {
      const { result } = renderHookWithStore(() => useTableRow("Events", ID_A));

      await waitFor(() => expect(result.current.row).toEqual(ROW_A));

      rowAStatus = "server-error";
      result.current.refetch();

      await waitFor(() => expect(result.current.error).toBeTruthy());
      // A 500 does not mean the row is gone — degrade to stale-plus-error, not
      // to a blank page.
      expect(result.current.row).toEqual(ROW_A);
    });

    it("keeps the last good row when a refetch fails with a 400", async () => {
      const { result } = renderHookWithStore(() => useTableRow("Events", ID_A));

      await waitFor(() => expect(result.current.row).toEqual(ROW_A));

      rowAStatus = "bad-request";
      result.current.refetch();

      await waitFor(() => expect(result.current.error).toBeTruthy());
      // Only a 404 means absent. Everything else keeps what we last had.
      expect(result.current.row).toEqual(ROW_A);
    });

    it("keeps the last good row when the request never reaches the server", async () => {
      const { result } = renderHookWithStore(() => useTableRow("Events", ID_A));

      await waitFor(() => expect(result.current.row).toEqual(ROW_A));

      fetchHandle.fetchMock.mockRejectedValueOnce(
        new TypeError("Failed to fetch"),
      );
      result.current.refetch();

      await waitFor(() => expect(result.current.error).toBeTruthy());
      // A transport failure is the case most easily mistaken for "gone".
      expect(result.current.row).toEqual(ROW_A);
    });

    it("reports loading while retrying after the row was dropped by a 404", async () => {
      const { result } = renderHookWithStore(() => useTableRow("Events", ID_A));

      await waitFor(() => expect(result.current.row).toEqual(ROW_A));

      rowAStatus = "gone";
      result.current.refetch();
      await waitFor(() => expect(result.current.row).toBeNull());

      // Retry with nothing on screen: the caller needs a spinner here.
      rowAStatus = "ok";
      gateA = makeGate();
      const before = startsA;
      result.current.refetch();

      await waitFor(() => expect(startsA).toBe(before + 1));
      expect(result.current.loading).toBe(true);

      gateA.release();
      await waitFor(() => expect(result.current.row).toEqual(ROW_A));
      expect(result.current.loading).toBe(false);
    });
  });

  describe("interaction with useTable", () => {
    it("picks up an edit made through useTable, via the shared row tag", async () => {
      const { result } = renderHookWithStore(() => ({
        detail: useTableRow("Events", ID_A),
        list: useTable("Events"),
      }));

      await waitFor(() => expect(result.current.detail.row).toEqual(ROW_A));

      await result.current.list.updateRow(ID_A, { name: "renamed" });

      // No wiring between the two hooks — the mutation invalidates the row tag
      // this query provides, so the detail view refreshes on its own.
      await waitFor(() =>
        expect(result.current.detail.row?.name).toBe("renamed"),
      );
    });

    it("keeps the row on screen during that refetch, without a spinner", async () => {
      const { result } = renderHookWithStore(() => ({
        detail: useTableRow("Events", ID_A),
        list: useTable("Events"),
      }));

      await waitFor(() => expect(result.current.detail.row).toEqual(ROW_A));

      // Hold the invalidation-triggered GET open so its in-flight state is a
      // fact, not a timing window.
      gateA = makeGate();
      const before = startsA;
      await result.current.list.updateRow(ID_A, { name: "renamed" });
      await waitFor(() => expect(startsA).toBe(before + 1));

      // Stale-while-revalidate: the previous row stays on screen and the
      // caller is NOT told to show a spinner.
      expect(result.current.detail.row).toBeTruthy();
      expect(result.current.detail.loading).toBe(false);

      gateA.release();
      await waitFor(() =>
        expect(result.current.detail.row?.name).toBe("renamed"),
      );
    });

    it("a delete through useTable clears the detail view", async () => {
      const { result } = renderHookWithStore(() => ({
        detail: useTableRow("Events", ID_A),
        list: useTable("Events"),
      }));

      await waitFor(() => expect(result.current.detail.row).toEqual(ROW_A));

      rowAStatus = "gone";
      await result.current.list.deleteRow(ID_A);

      await waitFor(() => expect(result.current.detail.row).toBeNull());
      expect(result.current.detail.error).toBeTruthy();
    });

    it("is not refetched by a mutation on a different row", async () => {
      const { result } = renderHookWithStore(() => ({
        detail: useTableRow("Events", ID_A),
        list: useTable("Events"),
      }));

      await waitFor(() => expect(result.current.detail.row).toEqual(ROW_A));
      const before = getsForA();

      await result.current.list.updateRow(ID_B, { name: "other" });
      await new Promise((r) => setTimeout(r, 30));

      // Tagged by row id, so an unrelated row's edit must not refetch this one.
      expect(getsForA()).toBe(before);
    });
  });

  describe("refetch", () => {
    it("is a no-op instead of throwing while skipped", () => {
      const { result } = renderHookWithStore(() => useTableRow("Events", null));

      expect(() => result.current.refetch()).not.toThrow();
    });

    it("works once rowId resolves after mounting skipped", async () => {
      const { result, rerender } = renderHookWithStore(
        ({ id }: { id: string | null }) => useTableRow("Events", id),
        { initialProps: { id: null as string | null } },
      );

      rerender({ id: ID_A });
      await waitFor(() => expect(result.current.row).toEqual(ROW_A));

      const before = getsForA();
      expect(() => result.current.refetch()).not.toThrow();
      await waitFor(() => expect(getsForA()).toBe(before + 1));
    });
  });
});
