import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";

import {
  SublayError,
  toSublayError,
  toSublayErrorRecord,
  fromSublayErrorRecord,
} from "./SublayError";
import { SuspendedError } from "./SuspendedError";
import { AccountTransitionError } from "../hooks/auth/accountTransition";

function axiosFailure(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    `Request failed with status code ${status}`,
    "ERR_BAD_REQUEST",
    config,
    {},
    { status, statusText: "", headers: {}, config, data },
  );
}

describe("toSublayError", () => {
  it("reads a v8 error body off an axios error response", () => {
    const original = axiosFailure(422, {
      error: "Title is too long.",
      code: "entity/invalid-title",
      param: "title",
    });

    const error = toSublayError(original);

    expect(error).toBeInstanceOf(SublayError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Title is too long.");
    expect(error.code).toBe("entity/invalid-title");
    expect(error.param).toBe("title");
    expect(error.status).toBe(422);
    expect(error.cause).toBe(original);
  });

  it("reads an RTK Query error ({ status, data })", () => {
    const original = { status: 404, data: { error: "Row not found.", code: "database/row-not-found" } };

    const error = toSublayError(original);

    expect(error.message).toBe("Row not found.");
    expect(error.code).toBe("database/row-not-found");
    expect(error.param).toBeUndefined();
    expect(error.status).toBe(404);
    expect(error.cause).toBe(original);
  });

  it("keeps the status of a response with no error body, with the client's message", () => {
    const error = toSublayError(axiosFailure(502, "<html>Bad gateway</html>"));

    expect(error.message).toBe("Request failed with status code 502");
    expect(error.status).toBe(502);
    expect(error.code).toBeUndefined();
  });

  it("keeps the status of an RTK Query response whose body isn't JSON", () => {
    const original = {
      status: "PARSING_ERROR",
      originalStatus: 502,
      data: "<html>Bad gateway</html>",
      error: "SyntaxError: Unexpected token '<'",
    };

    const error = toSublayError(original);

    expect(error.status).toBe(502);
    expect(error.message).toBe("Request failed with status 502");
    expect(error.code).toBeUndefined();
    expect(error.cause).toBe(original);
  });

  it("takes a network error's message, with no code or status", () => {
    const original = new AxiosError("Network Error", "ERR_NETWORK");

    const error = toSublayError(original);

    expect(error.message).toBe("Network Error");
    expect(error.code).toBeUndefined();
    expect(error.status).toBeUndefined();
    expect(error.cause).toBe(original);
  });

  it("takes the text of an RTK Query fetch failure", () => {
    const error = toSublayError({ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" });

    expect(error.message).toBe("TypeError: Failed to fetch");
    expect(error.code).toBeUndefined();
    expect(error.status).toBeUndefined();
  });

  it("wraps a thrown non-Error value", () => {
    expect(toSublayError("boom").message).toBe("boom");
    expect(toSublayError("boom").cause).toBe("boom");
    expect(toSublayError(42).message).toBe("42");
    expect(toSublayError(undefined).message).toBe("Unknown error");
    expect(toSublayError({}).message).toBe("Unknown error");
  });

  it("wraps a plain Error, keeping it as the cause", () => {
    const original = new Error("Something broke");

    const error = toSublayError(original);

    expect(error).not.toBe(original);
    expect(error.message).toBe("Something broke");
    expect(error.code).toBeUndefined();
    expect(error.cause).toBe(original);
  });

  it("passes a SublayError through unchanged", () => {
    const original = new SublayError("Already one", { code: "x/y", status: 400 });
    expect(toSublayError(original)).toBe(original);
  });

  it("passes the SDK's special errors through unchanged", () => {
    const suspended = new SuspendedError({ reason: "spam", endDate: null });
    const transition = new AccountTransitionError("Account a not found", false, true);

    expect(toSublayError(suspended)).toBe(suspended);
    expect(suspended.code).toBe("user/suspended");
    expect(suspended.status).toBe(403);
    expect(suspended.reason).toBe("spam");

    expect(toSublayError(transition)).toBe(transition);
    expect(transition.accountNotFound).toBe(true);
  });
});

describe("SublayError records", () => {
  it("reads back the same error a record was made from", () => {
    const original = axiosFailure(409, { error: "Taken.", code: "user/username-taken", param: "username" });

    const record = toSublayErrorRecord(original);
    expect(record).toEqual({
      message: "Taken.",
      code: "user/username-taken",
      param: "username",
      status: 409,
    });

    const error = fromSublayErrorRecord(record);
    expect(error).toBe(fromSublayErrorRecord(record));
    expect(error.cause).toBe(original);
  });

  it("rebuilds an error from a record it did not make", () => {
    const error = fromSublayErrorRecord({ message: "boom", code: "a/b", status: 500 });

    expect(error).toBeInstanceOf(SublayError);
    expect(error).toMatchObject({ message: "boom", code: "a/b", status: 500 });
  });
});
