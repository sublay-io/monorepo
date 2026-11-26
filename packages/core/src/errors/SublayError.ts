/**
 * The error every SDK hook exposes as `error`.
 *
 * When the server answered, `message` is its `error` text and `code`, `param`
 * and `status` come from the same response (`{ error, code, param? }` plus the
 * HTTP status). When it didn't (no network, a timeout, a failure inside the
 * SDK), `message` describes what went wrong and there is no `code`.
 *
 * `cause` holds the original thrown value (the HTTP client's error, for a
 * failed request).
 */
export class SublayError extends Error {
  /** The server's machine-readable error code, e.g. `"space/not-found"`. */
  readonly code?: string;
  /** The HTTP status of the response, when the server answered. */
  readonly status?: number;
  /** The request field the error is about, when the server names one. */
  readonly param?: string;
  /** The original thrown value this error was made from. */
  readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      code?: string;
      status?: number;
      param?: string;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = "SublayError";
    if (options.code !== undefined) this.code = options.code;
    if (options.status !== undefined) this.status = options.status;
    if (options.param !== undefined) this.param = options.param;
    if (options.cause !== undefined) this.cause = options.cause;

    // Restore the prototype chain for `instanceof` across transpile targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const UNKNOWN_ERROR_MESSAGE = "Unknown error";

type ErrorBody = { error?: unknown; code?: unknown; param?: unknown };

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

/**
 * The status and body of a failed HTTP request, from either client the SDK
 * uses: axios (`err.response`) or RTK Query's `fetchBaseQuery` (`{ status,
 * data }`, with a numeric status). `null` for anything that isn't a server
 * answer.
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
  const rtk = err as { status?: unknown; data?: unknown };
  if (typeof rtk.status === "number" && "data" in rtk) {
    return { status: rtk.status, body: rtk.data };
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
 *   taken from it, with no `code`.
 *
 * `cause` is set to `err`.
 */
export function toSublayError(err: unknown): SublayError {
  if (err instanceof SublayError) return err;

  const http = readHttpFailure(err);
  if (http) {
    const body =
      typeof http.body === "object" && http.body !== null
        ? (http.body as ErrorBody)
        : null;
    const message =
      nonEmptyString(body?.error) ??
      nonEmptyString((err as { message?: unknown }).message) ??
      `Request failed with status ${http.status}`;
    return new SublayError(message, {
      code: nonEmptyString(body?.code),
      param: nonEmptyString(body?.param),
      status: http.status,
      cause: err,
    });
  }

  if (typeof err === "string") {
    return new SublayError(err || UNKNOWN_ERROR_MESSAGE, { cause: err });
  }

  if (typeof err === "object" && err !== null) {
    // RTK Query's non-HTTP failures (`FETCH_ERROR`, `TIMEOUT_ERROR`, ...)
    // carry their text on `error`; an `Error` and RTK's serialized thunk
    // errors carry it on `message`.
    const message =
      nonEmptyString((err as { message?: unknown }).message) ??
      nonEmptyString((err as { error?: unknown }).error) ??
      UNKNOWN_ERROR_MESSAGE;
    return new SublayError(message, { cause: err });
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
    })
  );
}
