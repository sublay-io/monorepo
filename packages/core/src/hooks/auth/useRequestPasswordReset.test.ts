import { describe, it, expect, afterEach } from "vitest";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useRequestPasswordReset from "./useRequestPasswordReset";

afterEach(() => {
  resetAxiosMocks();
});

describe("useRequestPasswordReset", () => {
  it("requests a password reset email for a trimmed address", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() =>
      useRequestPasswordReset(),
    );

    axiosPublic.mockResponse("post", "", 204);

    const returned = await result.current({ email: "  alice@example.com  " });

    expect(returned).toBeUndefined();

    const [call] = axiosPublic.calls("post");
    expect(call.url).toBe("/test-project/auth/request-password-reset");
    expect(call.body).toEqual({ email: "alice@example.com" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() =>
      useRequestPasswordReset(),
    );

    axiosPublic.mockError("post", 500, { message: "Internal error" });

    await expect(
      result.current({ email: "alice@example.com" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when the email is blank", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() =>
      useRequestPasswordReset(),
    );

    await expect(result.current({ email: "   " })).rejects.toThrow(
      "Email is required.",
    );
    expect(axiosPublic.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPublic } = renderHookWithAxios(
      () => useRequestPasswordReset(),
      { projectId: "" },
    );

    await expect(
      result.current({ email: "alice@example.com" }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPublic.calls("post")).toHaveLength(0);
  });
});
