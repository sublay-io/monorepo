import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../../test-utils";
import useDeleteRule from "./useDeleteRule";

afterEach(() => {
  resetAxiosMocks();
});

describe("useDeleteRule", () => {
  it("deletes a rule", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteRule());

    axiosPrivate.mockResponse("delete", "", 204);

    let returned: unknown = "unset";
    await act(async () => {
      returned = await result.current({ spaceId: "space-1", ruleId: "rule-1" });
    });

    expect(returned).toBeUndefined();

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/spaces/space-1/rules/rule-1");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteRule());

    axiosPrivate.mockError("delete", 403, { message: "Forbidden" });

    await expect(
      result.current({ spaceId: "space-1", ruleId: "rule-1" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("throws before making a request when no rule ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteRule());

    await expect(
      result.current({ spaceId: "space-1", ruleId: "" }),
    ).rejects.toThrow("Please pass a ruleId");
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});
