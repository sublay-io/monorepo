import { describe, it, expect, afterEach, vi } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useSignTestingJwt from "./useSignTestingJwt";

afterEach(() => {
  resetAxiosMocks();
});

describe("useSignTestingJwt", () => {
  it("signs a testing JWT and warns about its insecurity", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result, axiosPublic } = renderHookWithAxios(() => useSignTestingJwt());

    axiosPublic.mockResponse("post", "signed.jwt.token");

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current({
        projectId: "test-project",
        privateKey: "secret-key",
        userData: { id: "user-1" },
      });
    });

    expect(returned).toBe("signed.jwt.token");
    expect(warnSpy).toHaveBeenCalledTimes(1);

    const [call] = axiosPublic.calls("post");
    expect(call.url).toBe("/test-project/crypto/sign-testing-jwt/v2");
    // The project is read from the path only; it never goes in the body.
    expect(call.body).toEqual({
      privateKey: "secret-key",
      userData: { id: "user-1" },
    });

    warnSpy.mockRestore();
  });

  it("swallows a server error and returns undefined instead of throwing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result, axiosPublic } = renderHookWithAxios(() => useSignTestingJwt());

    axiosPublic.mockError("post", 500, { message: "Internal error" });

    const returned = await result.current({
      projectId: "test-project",
      privateKey: "secret-key",
      userData: { id: "user-1" },
    });

    expect(returned).toBeUndefined();
  });

  it("returns undefined without making a request when no project ID is passed", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result, axiosPublic } = renderHookWithAxios(() => useSignTestingJwt());

    const returned = await result.current({
      projectId: "",
      privateKey: "secret-key",
      userData: { id: "user-1" },
    });

    expect(returned).toBeUndefined();
    expect(axiosPublic.calls("post")).toHaveLength(0);
  });
});
