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

let fetchHandle: FetchMockHandle;

/** Delay applied to the ID_B response so mid-flight state is observable. */
let slowB = 0;
/** Flips ID_A from 200 to 404, to model a row deleted behind our back. */
let rowAGone = false;
/** Server-side name for ID_A, so a PATCH is visible to a later GET. */
let rowAName = "alpha";

beforeEach(() => {
  slowB = 0;
  rowAGone = false;
  rowAName = "alpha";
  fetchHandle = stubFetchMock(async (...args: unknown[]) => {
    const req = args[0] as Request | string;
    const url = typeof req === "string" ? req : req.url;
    const method =
      (typeof req === "string"
        ? (args[1] as RequestInit | undefined)?.method
        : (req as Request).method) ?? "GET";

    if (method === "GET" && url.includes(`/db/Events/${ID_A}`)) {
      return rowAGone
        ? jsonResponse(
            { error: "Not Found", code: "database/row-not-found" },
            404,
          )
        : jsonResponse({ row: { ...ROW_A, name: rowAName } });
    }
    if (method === "GET" && url.includes(`/db/Events/${ID_B}`)) {
      if (slowB) await new Promise((r) => setTimeout(r, slowB));
      return jsonResponse({ row: ROW_B });
    }
    if (method === "GET" && url.includes(`/db/Events/${ID_GONE}`)) {
      return jsonResponse(
        { error: "Not Found", code: "database/row-not-found" },
        404,
      );
    }
    if (method === "PATCH" && url.includes(`/db/Events/${ID_A}`)) {
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
  cleanup();
  unstubFetchMock();
});

describe("useTableRow", () => {
  it("loads a single row from the exact /db single-row route", async () => {
    const { result } = renderHookWithStore(() => useTableRow("Events", ID_A));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.row).toEqual(ROW_A);
    expect(result.current.error).toBeFalsy();

    // Full-URL equality, not a substring: a substring match cannot catch an
    // extra or reordered path segment, which is the failure mode that has
    // shipped here before (server#122).
    expect(fetchHandle.calls()[0].url).toBe(
      `https://api.sublay.io/v7/test-project/db/Events/${ID_A}`,
    );
  });

  it("skips the request until rowId is present", async () => {
    const { result, rerender } = renderHookWithStore(
      ({ id }: { id: string | null }) => useTableRow("Events", id),
      { initialProps: { id: null as string | null } },
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.row).toBeNull();
    expect(
      fetchHandle.calls().filter((c) => c.url.includes("/db/Events")),
    ).toHaveLength(0);

    rerender({ id: ID_A });

    await waitFor(() => expect(result.current.row).toEqual(ROW_A));
  });

  it("does not serve the previous row while a new rowId is in flight", async () => {
    slowB = 150;
    const { result, rerender } = renderHookWithStore(
      ({ id }: { id: string }) => useTableRow("Events", id),
      { initialProps: { id: ID_A } },
    );

    await waitFor(() => expect(result.current.row).toEqual(ROW_A));

    rerender({ id: ID_B });

    // Mid-flight: the old row must be gone, not rendered under the new id.
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.row).toBeNull();

    await waitFor(() => expect(result.current.row).toEqual(ROW_B), {
      timeout: 2000,
    });
    expect(result.current.loading).toBe(false);
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

    // The row is deleted behind our back; the next read 404s.
    rowAGone = true;
    result.current.refetch();

    await waitFor(() => expect(result.current.error).toBeTruthy());
    // Must not keep rendering a record the server says is gone.
    expect(result.current.row).toBeNull();
  });

  it("refetch() is a no-op instead of throwing while skipped", () => {
    const { result } = renderHookWithStore(() => useTableRow("Events", null));

    expect(() => result.current.refetch()).not.toThrow();
  });

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
});
