import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../../test-utils";
import useFetchRule from "./useFetchRule";
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

describe("useFetchRule", () => {
  it("fetches a single rule", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchRule());

    const rule = makeRule();
    axiosPrivate.mockResponse("get", rule);

    let returned: Rule | undefined;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1", ruleId: "rule-1" });
    });

    expect(returned).toEqual(rule);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/space-1/rules/rule-1");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchRule());

    axiosPrivate.mockError("get", 404, { message: "Not found" });

    await expect(
      result.current({ spaceId: "space-1", ruleId: "rule-1" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws before making a request when no rule ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchRule());

    await expect(
      result.current({ spaceId: "space-1", ruleId: "" }),
    ).rejects.toThrow("Please pass a ruleId");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
