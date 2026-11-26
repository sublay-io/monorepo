/**
 * The error every SDK hook exposes as `error`.
 *
 * When the server answered, `message` is its `error` text and `code`, `param`
 * and `status` come from the same response (`{ error, code, param? }` plus the
 * HTTP status). When it didn't (no network, a timeout, a failure inside the
 * SDK), `message` describes what went wrong and there is no `code`.
 *
 * `body` is the server's whole JSON error body as sent, extra fields included
 * (for example `ownedWorkspaces`, `missingTables`, `verificationId`). `cause`
 * holds the original thrown value (the HTTP client's error, for a failed
 * request).
 */
export class SublayError extends Error {
  /** The server's machine-readable error code, e.g. `"space/not-found"`. */
  readonly code?: string;
  /** The HTTP status of the response, when the server answered. */
  readonly status?: number;
  /** The request field the error is about, when the server names one. */
  readonly param?: string;
  /**
   * The server's JSON error body as sent (`error`, `code`, `param` and any
   * extra fields). Present only when the server answered with a JSON object.
   */
  readonly body?: Record<string, unknown>;
  /** The original thrown value this error was made from. */
  readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      code?: string;
      status?: number;
      param?: string;
      body?: Record<string, unknown>;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = "SublayError";
    if (options.code !== undefined) this.code = options.code;
    if (options.status !== undefined) this.status = options.status;
    if (options.param !== undefined) this.param = options.param;
    if (options.body !== undefined) this.body = options.body;
    if (options.cause !== undefined) this.cause = options.cause;

    // Restore the prototype chain for `instanceof` across transpile targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a write is blocked because the acting user is suspended.
 *
 * The server rejects participation/content writes for a suspended user with
 * `403` + body `{ error, code: "user/suspended", reason, endDate }`
 * (`endDate: null` = indefinite). The response interceptor
 * (`config/useAxiosPrivate.ts`) discriminates that response on `code` BEFORE
 * the generic 403 → token-refresh branch and rejects with this typed error, so
 * a blocked write neither triggers a spurious token refresh nor is silently
 * retried. `toSublayError` builds the same error from any `user/suspended`
 * response (the RTK Query paths included), so app callers can `catch` it and
 * branch on the suspension.
 *
 * Defined here rather than in `SuspendedError.ts` (which re-exports it) so
 * `toSublayError` can build it without a circular import.
 */
export const SUSPENDED_ERROR_CODE = "user/suspended";

/**
 * A {@link SublayError} with `code: "user/suspended"` and `status: 403`, plus
 * the suspension's `reason` and `endDate`.
 */
export class SuspendedError extends SublayError {
  /** Always `"user/suspended"` — matches the server's response `code`. */
  readonly code: typeof SUSPENDED_ERROR_CODE;
  /** Human-readable reason for the suspension, if the moderator provided one. */
  readonly reason: string | null;
  /** ISO end date of the suspension, or `null` for an indefinite suspension. */
  readonly endDate: string | null;

  constructor({
    message,
    reason,
    endDate,
    body,
    cause,
  }: {
    message?: string;
    reason: string | null;
    endDate: string | null;
    /** The server's JSON error body, when it answered with one. */
    body?: Record<string, unknown>;
    /** The original error (the HTTP client's 403). */
    cause?: unknown;
  }) {
    super(message ?? "This account is suspended.", {
      code: SUSPENDED_ERROR_CODE,
      status: 403,
      body,
      cause,
    });
    this.name = "SuspendedError";
    this.code = SUSPENDED_ERROR_CODE;
    this.reason = reason;
    this.endDate = endDate;

    // Restore prototype chain for `instanceof` across transpile targets.
    Object.setPrototypeOf(this, SuspendedError.prototype);
  }
}

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

/**
 * Narrowing helper so callers don't have to rely on `instanceof` alone (a
 * second copy of the SDK has its own class). Duck-typed: the suspension code
 * plus the `reason` and `endDate` fields it narrows to.
 */
export function isSuspendedError(err: unknown): err is SuspendedError {
  if (err instanceof SuspendedError) return true;
  if (typeof err !== "object" || err === null) return false;
  const candidate = err as { code?: unknown; reason?: unknown; endDate?: unknown };
  return (
    candidate.code === SUSPENDED_ERROR_CODE &&
    (typeof candidate.reason === "string" || candidate.reason === null) &&
    (typeof candidate.endDate === "string" || candidate.endDate === null)
  );
}

// The `name`s of `SublayError` and the SDK's subclasses of it.
const SUBLAY_ERROR_NAMES = new Set([
  "SublayError",
  "SuspendedError",
  "AccountTransitionError",
  "AccountTokenMintError",
  "AccountStorageMultiProjectError",
  "AccountStorageProjectMismatchError",
]);

/**
 * Whether `err` is a `SublayError`. Duck-typed as well as `instanceof`, so it
 * also holds for one made by another copy of the SDK (two installed versions)
 * and for one that went through a serializer (a Redux thunk's
 * `{ name, message, code }`), which `instanceof` misses.
 */
export function isSublayError(err: unknown): err is SublayError {
  if (err instanceof SublayError) return true;
  if (typeof err !== "object" || err === null) return false;
  const candidate = err as { name?: unknown; message?: unknown };
  return (
    typeof candidate.message === "string" &&
    typeof candidate.name === "string" &&
    SUBLAY_ERROR_NAMES.has(candidate.name)
  );
}

const UNKNOWN_ERROR_MESSAGE = "Unknown error";

const ABORT_NAMES = new Set(["AbortError", "CanceledError"]);


/** A plain object (a parsed JSON body), not an array or a class instance. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

/**
 * The status and body of a failed HTTP request, from either client the SDK
 * uses: axios (`err.response`) or RTK Query's `fetchBaseQuery` (`{ status,
 * data }` with a numeric status, or a `PARSING_ERROR` with its
 * `originalStatus`). `null` for anything that isn't a server answer.
 */
function readHttpFailure(
  err: unknown
): { status: number; body: unknown } | null {
  if (typeof err !== "object" || err === null) return null;
  const response = (err as { response?: { status?: unknown; data?: unknown } })
    .response;
  if (response && typeof response.status === "number") {
    return { status: response.status, body: response.data };
  }
  const rtk = err as { status?: unknown; originalStatus?: unknown; data?: unknown };
  if (typeof rtk.status === "number" && "data" in rtk) {
    return { status: rtk.status, body: rtk.data };
  }
  // A response whose body isn't JSON (a proxy's HTML error page): RTK Query
  // reports `status: "PARSING_ERROR"` with the real status as `originalStatus`.
  if (rtk.status === "PARSING_ERROR" && typeof rtk.originalStatus === "number") {
    return { status: rtk.originalStatus, body: rtk.data };
  }
  return null;
}

/**
 * Turns any failure into a {@link SublayError}:
 *
 * - a `SublayError` (including `SuspendedError` and `AccountTransitionError`)
 *   is returned unchanged;
 * - an HTTP error response: `message` is the body's `error`, plus its `code`
 *   and `param` and the response `status`;
 * - anything else (a network error, a thrown `Error`, a string): `message` is
 *   taken from it, with no `code`. An aborted request keeps its `name`
 *   (`"AbortError"` or `"CanceledError"`).
 *
 * `cause` is set to `err`.
 */
export function toSublayError(err: unknown): SublayError {
  if (err instanceof SublayError) return err;

  const http = readHttpFailure(err);
  if (http) {
    const body = isPlainObject(http.body) ? http.body : null;
    if (body?.code === SUSPENDED_ERROR_CODE) {
      return new SuspendedError({
        message: nonEmptyString(body.error),
        reason: stringOrNull(body.reason),
        endDate: stringOrNull(body.endDate),
        body,
        cause: err,
      });
    }
    const message =
      nonEmptyString(body?.error) ??
      nonEmptyString((err as { message?: unknown }).message) ??
      `Request failed with status ${http.status}`;
    return new SublayError(message, {
      code: nonEmptyString(body?.code),
      param: nonEmptyString(body?.param),
      status: http.status,
      body: body ?? undefined,
      cause: err,
    });
  }

  if (typeof err === "string") {
    return new SublayError(err || UNKNOWN_ERROR_MESSAGE, { cause: err });
  }

  if (isSublayError(err)) {
    // A SublayError this class didn't make (another copy of the SDK, or one a
    // serializer flattened): keep its fields.
    const other = err as {
      name: string;
      message: string;
      code?: unknown;
      status?: unknown;
      param?: unknown;
      body?: unknown;
      reason?: unknown;
      endDate?: unknown;
    };
    const body = isPlainObject(other.body) ? other.body : undefined;
    if (isSuspendedError(err)) {
      return new SuspendedError({
        message: other.message,
        reason: stringOrNull(other.reason),
        endDate: stringOrNull(other.endDate),
        body,
        cause: err,
      });
    }
    const error = new SublayError(other.message || UNKNOWN_ERROR_MESSAGE, {
      code: nonEmptyString(other.code),
      status: typeof other.status === "number" ? other.status : undefined,
      param: nonEmptyString(other.param),
      body,
      cause: err,
    });
    error.name = other.name;
    return error;
  }

  if (typeof err === "object" && err !== null) {
    // RTK Query's non-HTTP failures (`FETCH_ERROR`, `TIMEOUT_ERROR`, ...)
    // carry their text on `error`; an `Error` and RTK's serialized thunk
    // errors carry it on `message`.
    const message =
      nonEmptyString((err as { message?: unknown }).message) ??
      nonEmptyString((err as { error?: unknown }).error) ??
      UNKNOWN_ERROR_MESSAGE;
    const error = new SublayError(message, { cause: err });
    // An aborted request stays recognisable as one: `name` stays
    // `"AbortError"` (fetch, RTK Query) or `"CanceledError"` (axios).
    const name = (err as { name?: unknown }).name;
    if (typeof name === "string" && ABORT_NAMES.has(name)) error.name = name;
    return error;
  }

  return new SublayError(
    err === undefined || err === null ? UNKNOWN_ERROR_MESSAGE : String(err),
    { cause: err }
  );
}

/**
 * A `SublayError`'s fields as a plain object, for errors kept in the Redux
 * store (which holds serializable values only). Internal.
 */
export interface SublayErrorRecord {
  message: string;
  code?: string;
  status?: number;
  param?: string;
  body?: Record<string, unknown>;
}

// The error each record was made from, so reading it back gives the same
// object (with its `cause`) rather than a copy.
const originals = new WeakMap<SublayErrorRecord, SublayError>();

/** `toSublayError(err)` as a record for the store. Internal. */
export function toSublayErrorRecord(err: unknown): SublayErrorRecord {
  const error = toSublayError(err);
  const record: SublayErrorRecord = { message: error.message };
  if (error.code !== undefined) record.code = error.code;
  if (error.status !== undefined) record.status = error.status;
  if (error.param !== undefined) record.param = error.param;
  if (error.body !== undefined) record.body = error.body;
  originals.set(record, error);
  return record;
}

/** The `SublayError` a record from {@link toSublayErrorRecord} stands for. Internal. */
export function fromSublayErrorRecord(record: SublayErrorRecord): SublayError {
  return (
    originals.get(record) ??
    new SublayError(record.message, {
      code: record.code,
      status: record.status,
      param: record.param,
      body: record.body,
    })
  );
}


/**
 * For `.catch()` after an RTK Query `.unwrap()`: rethrows the failure as a
 * `SublayError`. The base query itself keeps returning RTK's plain error
 * objects, because RTK Query stores them in the Redux state, which must stay
 * serializable (an app's own store included). Internal.
 */
export const rethrowAsSublayError = (err: unknown): never => {
  throw toSublayError(err);
};
