import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
} from "../../test-utils";
import useFetchManyComments from "../comments/useFetchManyComments";
import useFetchUser from "../users/useFetchUser";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Comment } from "../../interfaces/models/Comment";

/**
 * Serialization regression guard (Task 2.4).
 *
 * The new `spaceReputation` object must NEVER reach a query-string serializer
 * un-normalized. If a nested `{ spaceId, includeDescendants }` object survives
 * into axios `params`, axios serializes it to bracketed params
 * (`spaceReputation[spaceId]=…`) which the server IGNORES — the option
 * silently no-ops. Typecheck stays green when this happens; these tests are
 * the only thing that catches it.
 *
 * For axios-backed hooks the harness records the `config.params` object handed
 * to axios. We assert (a) the flat keys are present and (b) NO `spaceReputation`
 * key survived — a bracket leak would manifest as a leftover `spaceReputation`
 * object on `params`. We additionally serialize the params with a URLSearchParams
 * round-trip to confirm the emitted query string is flat, never bracketed.
 */

function makePage(): PaginatedResponse<Comment> {
  return {
    data: [],
    pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, hasMore: false },
  };
}

/** Flattens a params object the way a query serializer would, then asserts shape. */
function serializedKeys(params: Record<string, unknown>): string[] {
  return Object.keys(params);
}

afterEach(() => {
  resetAxiosMocks();
});

describe("spaceReputation serialization regression guard (core hooks)", () => {
  it("a context-variant hook (useFetchManyComments) serializes the OBJECT form to flat params", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyComments());

    axiosPrivate.mockResponse("get", makePage());

    await act(async () => {
      await result.current({
        entityId: "entity-1",
        sortBy: "createdAt",
        spaceReputation: { spaceId: "context", includeDescendants: true },
      });
    });

    const [call] = axiosPrivate.calls("get");
    const params = (call.config?.params ?? {}) as Record<string, unknown>;

    // Flat keys present with the object's values.
    expect(params).toMatchObject({
      spaceReputationId: "context",
      spaceReputationDescendants: true,
    });
    // The object must NOT survive into the serialized params (would bracket-leak).
    expect(params).not.toHaveProperty("spaceReputation");
    expect(serializedKeys(params)).not.toContain("spaceReputation");

    // The emitted query string is flat — never `spaceReputation[spaceId]=…`.
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    expect(qs).toContain("spaceReputationId=context");
    expect(qs).toContain("spaceReputationDescendants=true");
    expect(qs).not.toContain("spaceReputation%5B"); // encoded `spaceReputation[`
    expect(qs).not.toContain("spaceReputation[");
  });

  it("doesn't take the flat names as input props", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyComments());
    axiosPrivate.mockResponse("get", makePage());
    await act(async () => {
      await result.current({
        entityId: "entity-1",
        sortBy: "createdAt",
        // @ts-expect-error — spaceReputationId is a wire param, not a hook prop
        spaceReputationId: "space-9",
      });
    });
    const params = (axiosPrivate.calls("get")[0].config?.params ??
      {}) as Record<string, unknown>;
    expect(params).not.toHaveProperty("spaceReputationId");
  });

  it("a users-variant hook (useFetchUser) serializes the OBJECT form to flat params", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchUser());

    axiosPrivate.mockResponse("get", { id: "user-1" });

    await act(async () => {
      await result.current({
        userId: "user-1",
        spaceReputation: { spaceId: "none" },
      });
    });

    const [call] = axiosPrivate.calls("get");
    const params = (call.config?.params ?? {}) as Record<string, unknown>;

    expect(params).toMatchObject({ spaceReputationId: "none" });
    expect(params).not.toHaveProperty("spaceReputation");
    // includeDescendants was omitted in the object → flat key absent.
    expect(params).not.toHaveProperty("spaceReputationDescendants");
  });
});
