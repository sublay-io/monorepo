import { useMemo, useSyncExternalStore } from "react";
import { useStore } from "react-redux";
import type { Store } from "@reduxjs/toolkit";
import type { SublayState } from "../../store/sublayReducers";
import { handleError } from "../../utils/handleError";
import { toError } from "../../utils/toError";

/**
 * The load bookkeeping of one store-backed list (an entity list, the
 * notifications list, a conversation's messages, …), shared by every mounted
 * hook that shows it. The items, `loading` and paging state stay in the Redux
 * slice; this holds what has to be synchronous or isn't serializable:
 *
 * - `generation`: bumped by a load that supersedes the others (a reset, a
 *   refetch, a retry of the first page) and by `invalidate()`; a response from
 *   an older generation is dropped. Loads that only add to the list (opening
 *   a conversation, the next page) don't bump it, so two hooks opening the
 *   same list with different options both land.
 * - `inFlight`: set synchronously while any load of the current generation
 *   runs, so two `loadMore()` calls in the same tick (from one hook or from
 *   two hooks on the same list) load one page.
 * - `failed`: which load failed last, so `loadMore()` retries it.
 * - `error`: the last failure, as an `Error` (subscribed to by the hooks).
 */
export class SharedListStatus {
  generation = 0;
  /** The loads of the current generation still running. */
  private running = new Set<object>();
  /** A reset is scheduled (a debounced filter change): no page loads until it runs. */
  pendingReset = false;
  failed: "first" | "next" | null = null;
  /** The `kind` the failed load was run with (see `runSharedListLoad`), so a retry repeats it. */
  failedKind: string | null = null;
  private error: Error | null = null;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getError = () => this.error;

  get inFlight(): boolean {
    return this.running.size > 0;
  }

  /** Mark a load of the current generation as running; returns its token. */
  begin(): object {
    const token = {};
    this.running.add(token);
    return token;
  }

  end(token: object) {
    this.running.delete(token);
  }

  /** A load that wasn't run through `runSharedListLoad` (a reconnect catch-up) brought the list up to date. */
  clearFailure() {
    this.failed = null;
    this.failedKind = null;
    this.setError(null);
  }

  setError(error: Error | null) {
    if (error === this.error) return;
    this.error = error;
    this.listeners.forEach((listener) => listener());
  }

  /** Drop every load in flight (the list's query changed). */
  invalidate() {
    this.generation++;
    this.running = new Set();
    this.pendingReset = false;
    this.failed = null;
    this.failedKind = null;
    this.setError(null);
  }
}

type SublayStore = Pick<Store<{ sublay: SublayState }>, "getState" | "subscribe">;

// Keyed by the Redux store, so two providers (or two tests) never share one.
const registry = new WeakMap<object, Map<string, SharedListStatus>>();

const readEpoch = (store: SublayStore) => store.getState().sublay?.accountEpoch ?? 0;

export function getSharedListStatus(store: SublayStore, key: string): SharedListStatus {
  let lists = registry.get(store);
  if (!lists) {
    const created = new Map<string, SharedListStatus>();
    lists = created;
    registry.set(store, created);
    // An account change (`resetAccountScopedState`) empties the lists in the
    // store; their status starts over with them: errors cleared, and a load
    // still in flight for the previous account dropped when it lands.
    let epoch = readEpoch(store);
    store.subscribe(() => {
      const next = readEpoch(store);
      if (next === epoch) return;
      epoch = next;
      created.forEach((status) => status.invalidate());
    });
  }
  let status = lists.get(key);
  if (!status) {
    status = new SharedListStatus();
    lists.set(key, status);
  }
  return status;
}

/** The shared status of the list `key` in this provider's store, and its current error. */
export function useSharedListStatus(key: string): {
  status: SharedListStatus;
  error: Error | null;
} {
  const store = useStore<{ sublay: SublayState }>();
  const status = useMemo(() => getSharedListStatus(store, key), [store, key]);
  const error = useSyncExternalStore(status.subscribe, status.getError, status.getError);
  return { status, error };
}

export interface SharedListLoadOptions {
  /** A first-page load (failures are retried as the first page). */
  first: boolean;
  /**
   * The load replaces what the others would bring (a reset, a refetch): it
   * starts a new generation, so loads still in flight are dropped. `false`:
   * it only adds to the list (opening it, the next page) and runs alongside.
   * Default `true` for a first page, `false` otherwise.
   */
  supersede?: boolean;
  /** Kept as `failedKind` when the load fails, for a retry that repeats it. Default "first" / "next". */
  kind?: string;
  /** Prefix for the logged failure; `null` when `load` logs it already. */
  errorLabel: string | null;
  /**
   * Called once no load of the current generation is running any more (after
   * this one, and any sibling that ran alongside it, settled) — where a list
   * whose loads can overlap clears its `loading` flag.
   */
  onIdle?: () => void;
}

/**
 * Run one load of a shared list. `load` does the request and writes the
 * result to the store, but only while `isCurrent()` is true — after a
 * superseding load or an `invalidate()`, it must write nothing (not even
 * `loading: false`). A failure is recorded on the status (`error`, `failed`,
 * `failedKind`) and logged; the returned promise never rejects.
 */
export async function runSharedListLoad(
  status: SharedListStatus,
  options: SharedListLoadOptions,
  load: (isCurrent: () => boolean) => Promise<void>,
): Promise<void> {
  const { first, supersede = first, kind, errorLabel, onIdle } = options;
  if (supersede) status.invalidate();
  const generation = status.generation;
  const isCurrent = () => generation === status.generation;
  const token = status.begin();
  status.pendingReset = false;
  status.clearFailure();
  try {
    await load(isCurrent);
    // A load of the current generation landed: a failure a sibling load left
    // (another hook opening the same list) no longer stands.
    if (isCurrent()) status.clearFailure();
  } catch (err) {
    if (!isCurrent()) return;
    status.failed = first ? "first" : "next";
    status.failedKind = kind ?? status.failed;
    status.setError(toError(err));
    if (errorLabel !== null) handleError(err, errorLabel);
  } finally {
    status.end(token);
    if (isCurrent() && !status.inFlight) onIdle?.();
  }
}

/**
 * The `loadMore()` of every store-backed list: nothing while a load runs or a
 * reset is scheduled; a failed first page is retried as the first page
 * (`retryFirst`, given the failed load's `kind`); otherwise the next page,
 * when it failed or there is one.
 */
export async function sharedLoadMore(
  status: SharedListStatus,
  handlers: {
    hasMore: () => boolean;
    retryFirst: (failedKind: string | null) => Promise<void>;
    next: () => Promise<void>;
  },
): Promise<void> {
  if (status.inFlight || status.pendingReset) return;
  if (status.failed === "first") {
    await handlers.retryFirst(status.failedKind);
  } else if (status.failed === "next" || handlers.hasMore()) {
    await handlers.next();
  }
}
