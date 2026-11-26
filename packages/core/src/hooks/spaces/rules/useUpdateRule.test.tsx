import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../../test-utils";
import useUpdateRule from "./useUpdateRule";
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

describe("useUpdateRule", () => {
  it("updates a rule", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateRule());

    const updated = makeRule({ title: "Be kind" });
    axiosPrivate.mockResponse("patch", updated);

    let returned: Rule | undefined;
    await act(async () => {
      returned = await result.current({
        spaceId: "space-1",
        ruleId: "rule-1",
        update: { title: "Be kind" },
      });
    });

    expect(returned).toEqual(updated);

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/spaces/space-1/rules/rule-1");
    expect(call.body).toEqual({ title: "Be kind" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateRule());

    axiosPrivate.mockError("patch", 403, { message: "Forbidden" });

    await expect(
      result.current({ spaceId: "space-1", ruleId: "rule-1", update: { title: "Be kind" } }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("throws before making a request when no rule ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateRule());

    await expect(
      result.current({ spaceId: "space-1", ruleId: "", update: { title: "Be kind" } }),
    ).rejects.toThrow("Please pass a ruleId");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});
