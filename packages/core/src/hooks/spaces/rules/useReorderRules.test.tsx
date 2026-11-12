import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../../test-utils";
import useReorderRules from "./useReorderRules";
import type { Rule } from "../../../interfaces/models/Rule";

afterEach(() => {
  resetAxiosMocks();
});

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "rule-1",
    projectId: "test-project",
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

describe("useReorderRules", () => {
  it("reorders rules", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useReorderRules());

    const reordered = [makeRule({ id: "rule-2", order: 0 }), makeRule({ id: "rule-1", order: 1 })];
    axiosPrivate.mockResponse("post", reordered);

    let returned: Rule[] | undefined;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1", ruleIds: ["rule-2", "rule-1"] });
    });

    expect(returned).toEqual(reordered);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/spaces/space-1/rules/reorder");
    expect(call.body).toEqual({ ruleIds: ["rule-2", "rule-1"] });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useReorderRules());

    axiosPrivate.mockError("post", 403, { message: "Forbidden" });

    await expect(
      result.current({ spaceId: "space-1", ruleIds: ["rule-1"] }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("throws before making a request when no rule IDs are passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useReorderRules());

    await expect(
      result.current({ spaceId: "space-1", ruleIds: [] }),
    ).rejects.toThrow("Please pass at least one ruleId");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});
