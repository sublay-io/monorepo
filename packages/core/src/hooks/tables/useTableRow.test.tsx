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

const ROW = { id: "1", name: "alpha" };

let fetchHandle: FetchMockHandle;

beforeEach(() => {
  fetchHandle = stubFetchMock(async (...args: unknown[]) => {
    const req = args[0] as Request | string;
    const url = typeof req === "string" ? req : req.url;
    const method =
      (typeof req === "string"
        ? (args[1] as RequestInit | undefined)?.method
        : (req as Request).method) ?? "GET";

    if (method === "GET" && url.includes("/db/Events/1")) {
      return jsonResponse({ row: ROW });
    }
    if (method === "GET" && url.includes("/db/Events/missing")) {
      return jsonResponse(
        { error: "Not Found", code: "database/row-not-found" },
        404,
      );
    }
    return jsonResponse({}, 404);
  });
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

describe("useTableRow", () => {
  it("loads a single row from the /db surface", async () => {
    const { result } = renderHookWithStore(() => useTableRow("Events", "1"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.row).toEqual(ROW);
    expect(result.current.error).toBeFalsy();

    // Hit the single-row route with the logical table name, not the list route.
    const call = fetchHandle
      .calls()
      .find((c) => c.url.includes("/test-project/db/Events/1"));
    expect(call).toBeTruthy();
  });

  it("skips the request until rowId is present", async () => {
    const { result, rerender } = renderHookWithStore(
      ({ id }: { id: string | null }) => useTableRow("Events", id),
      { initialProps: { id: null as string | null } },
    );

    // A skipped query must not strand the caller on a spinner.
    expect(result.current.loading).toBe(false);
    expect(result.current.row).toBeNull();
    expect(fetchHandle.calls().filter((c) => c.url.includes("/db/Events")))
      .toHaveLength(0);

    rerender({ id: "1" });

    await waitFor(() => expect(result.current.row).toEqual(ROW));
    expect(
      fetchHandle.calls().filter((c) => c.url.includes("/db/Events/1")).length,
    ).toBeGreaterThan(0);
  });

  it("surfaces a 404 as error, not as a row", async () => {
    const { result } = renderHookWithStore(() =>
      useTableRow("Events", "missing"),
    );

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.row).toBeNull();
  });
});
