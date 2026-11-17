import { describe, it, expect } from "vitest";
import { isCredentialRejection } from "./credentialRejection";

const withResponse = (status: number, data?: unknown) => ({
  response: { status, data },
});

describe("isCredentialRejection", () => {
  it("is true for a 401 or 403", () => {
    expect(isCredentialRejection(withResponse(401))).toBe(true);
    expect(isCredentialRejection(withResponse(403, { code: "auth/token-reuse-detected" }))).toBe(true);
  });

  it("is true for a 404 auth/user-not-found: the token's user is gone", () => {
    expect(
      isCredentialRejection(withResponse(404, { error: "User not found.", code: "auth/user-not-found" })),
    ).toBe(true);
  });

  it("is false for any other 404", () => {
    expect(isCredentialRejection(withResponse(404))).toBe(false);
    expect(isCredentialRejection(withResponse(404, { code: "entity/not-found" }))).toBe(false);
  });

  it("is false for a transport failure (no response) and for a 5xx", () => {
    expect(isCredentialRejection(new Error("Network Error"))).toBe(false);
    expect(isCredentialRejection(null)).toBe(false);
    expect(isCredentialRejection(withResponse(500, { code: "auth/server-error" }))).toBe(false);
  });
});
