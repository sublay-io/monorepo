import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../../test-utils";
import useFetchManyRules from "./useFetchManyRules";
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

describe("useFetchManyRules", () => {
  it("returns the space's rules as an array", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyRules());

    const rule = makeRule();
    axiosPrivate.mockResponse("get", { data: [rule], count: 1 });

    let returned: Rule[] | undefined;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1" });
    });

    expect(returned).toEqual([rule]);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/space-1/rules");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyRules());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ spaceId: "space-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyRules());

    await expect(result.current({ spaceId: "" })).rejects.toThrow(
      "Please pass a spaceId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
