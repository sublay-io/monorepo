import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useAuth from "./useAuth";
import { SublayError } from "../../errors/SublayError";
import type { AuthUser } from "../../interfaces/models/User";

afterEach(() => {
  resetAxiosMocks();
});

describe("useAuth", () => {
  it("exposes the current token state from the store", () => {
    const { result } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });

    expect(result.current.accessToken).toBe("access-1");
    expect(result.current.refreshToken).toBe("refresh-1");
    expect(result.current.initialized).toBe(true);
  });

  it("signInWithEmailAndPassword updates the token state on success", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
    });
    const user = { id: "user-1" } as AuthUser;
    axiosPublic.mockResponse("post", { accessToken: "access-1", refreshToken: "refresh-1", user });

    await act(async () => {
      await result.current.signInWithEmailAndPassword({ email: "a@b.com", password: "secret" });
    });

    expect(result.current.accessToken).toBe("access-1");
    expect(axiosPublic.calls("post")[0].url).toBe("/project-1/auth/sign-in");
  });

  it("signInWithEmailAndPassword throws on a failed request", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
    });
    axiosPublic.mockError("post", 401, {
      error: "Invalid credentials",
      code: "auth/invalid-credentials",
    });

    await expect(
      act(async () => {
        await result.current.signInWithEmailAndPassword({ email: "a@b.com", password: "wrong" });
      }),
    ).rejects.toThrow();
  });

  it("signInWithEmailAndPassword throws an Error carrying the server code and verificationId", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
    });
    axiosPublic.mockError("post", 403, {
      error: "Confirm your email to sign in.",
      code: "auth/email-not-verified",
      verificationId: "vid-2",
    });

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.signInWithEmailAndPassword({
          email: "a@b.com",
          password: "secret",
          emailVerification: { mode: "code" },
        });
      } catch (error) {
        thrown = error;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown).toMatchObject({
      code: "auth/email-not-verified",
      status: 403,
      verificationId: "vid-2",
      // The whole body as sent, verificationId included.
      body: {
        error: "Confirm your email to sign in.",
        code: "auth/email-not-verified",
        verificationId: "vid-2",
      },
    });
    expect(axiosPublic.calls("post")[0].body).toMatchObject({
      emailVerification: { mode: "code" },
    });
  });

  it("signUpWithEmailAndPassword throws the server's error text, code and param", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
    });
    axiosPublic.mockError("post", 409, {
      error: "Email already in use",
      code: "auth/email-taken",
      param: "email",
    });

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.signUpWithEmailAndPassword({
          email: "a@b.com",
          password: "secret",
        });
      } catch (error) {
        thrown = error;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe("Email already in use");
    expect(thrown).toMatchObject({ code: "auth/email-taken", param: "email" });
  });

  it("signUpWithEmailAndPassword resolves the pending result when email verification is required", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
    });
    axiosPublic.mockResponse(
      "post",
      { success: true, emailVerificationRequired: true, verificationId: "vid-1" },
      202,
    );

    let returned: unknown;
    await act(async () => {
      returned = await result.current.signUpWithEmailAndPassword({
        email: "a@b.com",
        password: "secret",
        emailVerification: { mode: "code" },
      });
    });

    expect(returned).toEqual({ emailVerificationRequired: true, verificationId: "vid-1" });
    expect(result.current.accessToken).toBeNull();
  });

  it("signUpWithEmailAndPassword resolves nothing when it signs the user in", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
    });
    const user = { id: "user-1" } as AuthUser;
    axiosPublic.mockResponse("post", { accessToken: "access-1", refreshToken: "refresh-1", user });

    let returned: unknown = "unset";
    await act(async () => {
      returned = await result.current.signUpWithEmailAndPassword({
        email: "a@b.com",
        password: "secret",
      });
    });

    expect(returned).toBeUndefined();
    expect(result.current.accessToken).toBe("access-1");
  });

  it("signUpWithEmailAndPassword throws an Error carrying the server code", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
    });
    axiosPublic.mockError("post", 409, { error: "Username taken", code: "auth/username-taken" });

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.signUpWithEmailAndPassword({ email: "a@b.com", password: "secret" });
      } catch (error) {
        thrown = error;
      }
    });

    expect(thrown).toMatchObject({ code: "auth/username-taken" });
    expect((thrown as { verificationId?: string }).verificationId).toBeUndefined();
  });

  it("signOut with no refresh token rejects with the reason", async () => {
    const { result } = renderHookWithAxios(() => useAuth(), { projectId: "project-1" });

    const err = await result.current.signOut().catch((e: unknown) => e);

    expect(err).toBeInstanceOf(SublayError);
    expect((err as SublayError).message).toBe("No refresh token");
    expect((err as SublayError).code).toBeUndefined();
  });

  it("signOut clears the token state", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });
    axiosPublic.mockResponse("post", {});

    await act(async () => {
      await result.current.signOut();
    });

    await waitFor(() => expect(result.current.accessToken).toBeNull());
    expect(result.current.refreshToken).toBeNull();
  });

  it("requestNewAccessToken returns the rotated access token", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
      accessToken: "stale",
      refreshToken: "refresh-1",
    });
    const user = { id: "user-1" } as AuthUser;
    axiosPublic.mockResponse("post", { accessToken: "fresh", refreshToken: "refresh-2", user });

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.requestNewAccessToken();
    });

    expect(returned).toBe("fresh");
    expect(result.current.accessToken).toBe("fresh");
  });

  it("requestNewAccessToken THROWS when the refresh fails", async () => {
    // It used to return `undefined` for every failure, indistinguishable from
    // the no-projectId early return — i.e. it read as a call that simply had
    // nothing to do. Every other action on this hook throws on failure.
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
      accessToken: "stale",
      refreshToken: "refresh-1",
    });
    axiosPublic.mockError("post", 403, { error: "Refresh token revoked" });

    const err = await result.current.requestNewAccessToken().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SublayError);
    expect(err).toMatchObject({
      message: "Refresh token revoked",
      status: 403,
      body: { error: "Refresh token revoked" },
    });
  });

  it("changePassword rejects with the server's code, status and body", async () => {
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
      accessToken: "access-1",
      refreshToken: "refresh-1",
      user: { id: "user-1" } as AuthUser,
    });
    axiosPublic.mockError("post", 401, {
      error: "The current password is wrong.",
      code: "auth/wrong-password",
      param: "password",
    });

    const err = await result.current
      .changePassword({ password: "old", newPassword: "new" })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(SublayError);
    expect(err).toMatchObject({
      message: "The current password is wrong.",
      code: "auth/wrong-password",
      param: "password",
      status: 401,
      body: { error: "The current password is wrong.", code: "auth/wrong-password", param: "password" },
    });
  });

  it("requestNewAccessToken THROWS when there is no stored refresh token", async () => {
    // The `fulfilled`-with-`undefined` path — no network call at all.
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      projectId: "project-1",
    });

    await expect(result.current.requestNewAccessToken()).rejects.toThrow(
      "No refresh token available",
    );
    expect(axiosPublic.calls("post")).toHaveLength(0);
  });

  it("requestNewAccessToken THROWS when there is no project either", async () => {
    // The last path that still RESOLVED — with `undefined`, which is what the
    // declared `Promise<string | undefined>` was advertising. It reads as a
    // successful call that had nothing to do, and it is the one case a caller
    // could not tell apart from a real refusal. Every other action on this hook
    // throws the same error for a missing project.
    const { result, axiosPublic } = renderHookWithAxios(() => useAuth(), {
      // Null, not omitted: the harness defaults an omitted id, and null is the
      // shape a provider-less (or not-yet-configured) context actually has.
      projectId: null as unknown as string,
      refreshToken: "refresh-1",
    });

    await expect(result.current.requestNewAccessToken()).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPublic.calls("post")).toHaveLength(0);
  });
});
