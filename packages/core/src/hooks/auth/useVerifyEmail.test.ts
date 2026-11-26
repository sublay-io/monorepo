import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser } from "../../test-utils";
import useVerifyEmail from "./useVerifyEmail";
import { setUser as setUserInUserSlice } from "../../store/slices/userSlice";

afterEach(() => {
  resetAxiosMocks();
});

describe("useVerifyEmail", () => {
  it("verifies the email and optimistically marks the user slice as verified", async () => {
    const { result, store, axiosPublic } = renderHookWithAxios(() => useVerifyEmail());
    act(() => {
      store.dispatch(setUserInUserSlice(makeAuthUser({ isVerified: false })));
    });

    axiosPublic.mockResponse("post", "", 204);

    let returned;
    await act(async () => {
      returned = await result.current({ token: "  abc123  " });
    });

    expect(returned).toBeUndefined();

    const [call] = axiosPublic.calls("post");
    expect(call.url).toBe("/test-project/auth/verify-email");
    expect(call.body).toEqual({ token: "abc123" });

    expect(store.getState().sublay.user.user?.isVerified).toBe(true);
  });

  it("sends a code with its verificationId and leaves the signed-in user untouched", async () => {
    const { result, store, axiosPublic } = renderHookWithAxios(() => useVerifyEmail());
    act(() => {
      store.dispatch(setUserInUserSlice(makeAuthUser({ isVerified: false })));
    });

    axiosPublic.mockResponse("post", "", 204);

    await act(async () => {
      await result.current({ token: " 123456 ", verificationId: "vid-1" });
    });

    const [call] = axiosPublic.calls("post");
    expect(call.body).toEqual({ token: "123456", verificationId: "vid-1" });
    // The confirmed account is not the signed-in one.
    expect(store.getState().sublay.user.user?.isVerified).toBe(false);
  });

  it("does not throw when optimistically updating with no user yet in the slice", async () => {
    const { result, store, axiosPublic } = renderHookWithAxios(() => useVerifyEmail());

    axiosPublic.mockResponse("post", "", 204);

    await act(async () => {
      await result.current({ token: "abc123" });
    });

    expect(store.getState().sublay.user.user).toBeNull();
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useVerifyEmail());

    axiosPublic.mockError("post", 500, { message: "Internal error" });

    await expect(result.current({ token: "abc123" })).rejects.toMatchObject({
      status: 500,
    });
  });

  it("throws before making a request when the token is blank", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useVerifyEmail());

    await expect(result.current({ token: "   " })).rejects.toThrow(
      "Verification token is required.",
    );
    expect(axiosPublic.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useVerifyEmail(), {
      projectId: "",
    });

    await expect(result.current({ token: "abc123" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPublic.calls("post")).toHaveLength(0);
  });
});
