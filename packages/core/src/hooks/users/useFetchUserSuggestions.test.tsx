import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeUser } from "../../test-utils";
import useFetchUserSuggestions from "./useFetchUserSuggestions";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchUserSuggestions", () => {
  it("fetches user suggestions for a query", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchUserSuggestions(),
    );

    const users = [makeUser({ username: "alice" }), makeUser({ id: "user-2", username: "alicia" })];
    axiosPrivate.mockResponse("get", { data: users });

    let returned;
    await act(async () => {
      returned = await result.current({ query: "ali" });
    });

    expect(returned).toEqual(users);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/users/suggestions");
    expect(call.config?.params).toMatchObject({ query: "ali" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchUserSuggestions(),
    );

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ query: "ali" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchUserSuggestions(),
      { projectId: "" },
    );

    await expect(result.current({ query: "ali" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
