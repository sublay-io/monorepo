import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useCheckUsernameAvailability from "./useCheckUsernameAvailability";

afterEach(() => {
  resetAxiosMocks();
});

describe("useCheckUsernameAvailability", () => {
  it("checks whether a username is available", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() =>
      useCheckUsernameAvailability(),
    );

    axiosPublic.mockResponse("get", { available: true });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current({ username: "newuser" });
    });

    expect(returned).toBe(true);

    const [call] = axiosPublic.calls("get");
    expect(call.url).toBe("/test-project/users/check-username");
    expect(call.config?.params).toEqual({ username: "newuser" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() =>
      useCheckUsernameAvailability(),
    );

    axiosPublic.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ username: "newuser" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no username is passed", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() =>
      useCheckUsernameAvailability(),
    );

    await expect(result.current({ username: "" })).rejects.toThrow(
      "Please specify a username",
    );
    expect(axiosPublic.calls("get")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPublic } = renderHookWithAxios(
      () => useCheckUsernameAvailability(),
      { projectId: "" },
    );

    await expect(result.current({ username: "newuser" })).rejects.toThrow(
      "No project specified",
    );
    expect(axiosPublic.calls("get")).toHaveLength(0);
  });
});
