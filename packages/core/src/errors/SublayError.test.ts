import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";

import {
  SublayError,
  isSublayError,
  toSublayError,
  toSublayErrorRecord,
  fromSublayErrorRecord,
} from "./SublayError";
import { SuspendedError, isSuspendedError } from "./SuspendedError";
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

  it("keeps an axios response's whole JSON body, extra fields included", () => {
    const sent = {
      error: "The member owns workspaces.",
      code: "workspace/owns-descendants",
      ownedWorkspaces: [{ id: "w1", name: "Design" }],
      ownedCount: 1,
    };

    const error = toSublayError(axiosFailure(409, sent));

    expect(error.body).toEqual(sent);
    expect(error.body?.ownedCount).toBe(1);
    expect(error.code).toBe("workspace/owns-descendants");
  });

  it("keeps an RTK Query response's JSON body", () => {
    const sent = { error: "Missing tables.", code: "database/tables-not-available", missingTables: ["spaces"] };

    const error = toSublayError({ status: 403, data: sent });

    expect(error.body).toEqual(sent);
    expect(error.body?.missingTables).toEqual(["spaces"]);
  });

  it("has no body for a non-JSON response or a failure with no answer", () => {
    expect(toSublayError(axiosFailure(502, "<html>Bad gateway</html>")).body).toBeUndefined();
    expect(
      toSublayError({ status: "PARSING_ERROR", originalStatus: 502, data: "<html></html>" }).body,
    ).toBeUndefined();
    expect(toSublayError(axiosFailure(500, ["not", "an", "object"])).body).toBeUndefined();
    expect(toSublayError(new Error("offline")).body).toBeUndefined();
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
      body: { error: "Taken.", code: "user/username-taken", param: "username" },
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

describe("suspensions", () => {
  const suspended = {
    error: "Your account is suspended.",
    code: "user/suspended",
    reason: "spam",
    endDate: "2030-01-01T00:00:00.000Z",
  };

  it("an axios user/suspended response becomes a real SuspendedError", () => {
    const original = axiosFailure(403, suspended);

    const error = toSublayError(original);

    expect(error).toBeInstanceOf(SuspendedError);
    expect(error).toMatchObject({
      message: "Your account is suspended.",
      code: "user/suspended",
      status: 403,
      reason: "spam",
      endDate: "2030-01-01T00:00:00.000Z",
      body: suspended,
    });
    expect(error.cause).toBe(original);
    expect(isSuspendedError(error)).toBe(true);
  });

  it("an RTK Query user/suspended response becomes a real SuspendedError", () => {
    const error = toSublayError({ status: 403, data: { ...suspended, endDate: null } });

    expect(error).toBeInstanceOf(SuspendedError);
    expect((error as SuspendedError).reason).toBe("spam");
    expect((error as SuspendedError).endDate).toBeNull();
  });

  it("isSuspendedError narrows only to something with reason and endDate", () => {
    expect(isSuspendedError({ code: "user/suspended" })).toBe(false);
    expect(isSuspendedError({ code: "user/suspended", endDate: null })).toBe(false);
    expect(isSuspendedError({ code: "user/suspended", reason: null })).toBe(false);
    expect(isSuspendedError({ code: "user/suspended", reason: null, endDate: null })).toBe(true);
    expect(isSuspendedError(new SublayError("x", { code: "user/suspended" }))).toBe(false);
  });
});

describe("isSublayError", () => {
  it("holds for a SublayError, a subclass, and one from another copy of the SDK", () => {
    expect(isSublayError(new SublayError("x"))).toBe(true);
    expect(isSublayError(new SuspendedError({ reason: null, endDate: null }))).toBe(true);
    expect(isSublayError({ name: "SublayError", message: "x", code: "a/b" })).toBe(true);
    expect(isSublayError(new Error("x"))).toBe(false);
    expect(isSublayError({ name: "SublayError" })).toBe(false);
    expect(isSublayError("SublayError")).toBe(false);
  });

  it("toSublayError keeps the fields of a SublayError-shaped object", () => {
    const other = {
      name: "SublayError",
      message: "Not allowed.",
      code: "space/forbidden",
      status: 403,
      param: "spaceId",
      body: { error: "Not allowed.", code: "space/forbidden" },
    };

    const error = toSublayError(other);

    expect(error).toBeInstanceOf(SublayError);
    expect(error).toMatchObject(other);
    expect(error.cause).toBe(other);
  });

  it("keeps the code of a serialized thunk error ({ name, message, code })", () => {
    const error = toSublayError({ name: "AccountTransitionError", message: "Gone.", code: "auth/x" });

    expect(error.code).toBe("auth/x");
    expect(error.name).toBe("AccountTransitionError");
  });

  it("doesn't take the code of an error that isn't a SublayError", () => {
    const network = Object.assign(new Error("Network Error"), { code: "ERR_NETWORK", status: 0 });

    const error = toSublayError(network);

    expect(error.code).toBeUndefined();
    expect(error.status).toBeUndefined();
  });
});
