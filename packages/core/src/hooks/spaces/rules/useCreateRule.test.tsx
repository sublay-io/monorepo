import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../../test-utils";
import useCreateRule from "./useCreateRule";
import type { Rule } from "../../../interfaces/models/Rule";

afterEach(() => {
  resetAxiosMocks();
});

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "rule-1",
    spaceId: "space-1",
    title: "Be respectful",
    description: null,
    order: 0,
    lastApprovedBy: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useCreateRule", () => {
  it("creates a rule", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateRule());

    const rule = makeRule();
    axiosPrivate.mockResponse("post", rule, 201);

    let returned: Rule | undefined;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1", title: "Be respectful" });
    });

    expect(returned).toEqual(rule);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/spaces/space-1/rules");
    expect(call.body).toEqual({ title: "Be respectful", description: null });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateRule());

    axiosPrivate.mockError("post", 403, { message: "Forbidden" });

    await expect(
      result.current({ spaceId: "space-1", title: "Be respectful" }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("throws before making a request when no title is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateRule());

    await expect(
      result.current({ spaceId: "space-1", title: "" }),
    ).rejects.toThrow("Rule title is required");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateRule());

    await expect(
      result.current({ spaceId: "", title: "Be respectful" }),
    ).rejects.toThrow("Please pass a spaceId");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});
