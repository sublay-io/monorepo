import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, cleanup } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
import { useEntityListActions } from "./useEntityListActions";

/**
 * Serialization regression guard for the entity-lists path (Task 2.4b).
 *
 * The entity-lists path is a special case: it persists params in flat Redux
 * state and serializes via RTK Query's `fetchBaseQuery` (NOT axios). Its
 * `serializeObject` only runs for keys ending in `Filters`, so a stray
 * `spaceReputation` OBJECT on `spaceReputationId`/the params would stringify to
 * `[object Object]` and silently no-op. The object is flattened at the
 * `useEntityListActions` input boundary precisely to avoid this.
 *
 * `stubFetchMock().calls()` returns the real `Request.url` produced by
 * `fetchBaseQuery`, so we assert on the ACTUAL serialized query string.
 */

let fetchHandle: FetchMockHandle;

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

function okPage() {
  return jsonResponse({
    data: [],
    pagination: { page: 1, pageSize: 10, totalPages: 0, totalItems: 0, hasMore: false },
  });
}

describe("entity-lists spaceReputation serialization regression guard", () => {
  it("a list configured via the OBJECT form serializes to a flat spaceReputationId query", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(okPage());
    const { result } = renderHookWithStore(() => useEntityListActions(), {
      projectId: "test-project",
    });

    await act(async () => {
      await result.current.fetchEntities("feed", {
        page: 1,
        sortBy: "hot",
        limit: 10,
        spaceReputation: { spaceId: "space-7", includeDescendants: true },
      });
    });

    const url = new URL(fetchHandle.calls()[0].url);
    // Flat keys present with the object's values.
    expect(url.searchParams.get("spaceReputationId")).toBe("space-7");
    expect(url.searchParams.get("spaceReputationDescendants")).toBe("true");
    // The object must NOT have leaked — never bracketed, never `[object Object]`.
    expect(url.searchParams.has("spaceReputation")).toBe(false);
    expect(url.searchParams.has("spaceReputation[spaceId]")).toBe(false);
    expect(url.search).not.toContain("spaceReputation%5B");
    expect(url.search).not.toContain("%5Bobject+Object%5D");
    expect(url.search).not.toContain("[object Object]");
  });

  it("doesn't take the flat names as fetch options", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(okPage());
    const { result } = renderHookWithStore(() => useEntityListActions(), {
      projectId: "test-project",
    });

    await act(async () => {
      await result.current.fetchEntities("feed", {
        page: 1,
        sortBy: "hot",
        limit: 10,
        // @ts-expect-error — spaceReputationId is a wire param, not an option
        spaceReputationId: "space-7",
      });
    });

    const url = new URL(fetchHandle.calls()[0].url);
    expect(url.searchParams.has("spaceReputationId")).toBe(false);
  });
});
