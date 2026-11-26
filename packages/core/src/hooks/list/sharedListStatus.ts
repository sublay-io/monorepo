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
 * - `generation`: bumped by every load and by `invalidate()`; a response from
 *   an older generation is dropped.
 * - `inFlight`: set synchronously, so two `loadMore()` calls in the same tick
 *   (from one hook or from two hooks on the same list) load one page.
 * - `failed`: which load failed last, so `loadMore()` retries it.
 * - `error`: the last failure, as an `Error` (subscribed to by the hooks).
 */
export class SharedListStatus {
  generation = 0;
  inFlight = false;
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

  setError(error: Error | null) {
    if (error === this.error) return;
    this.error = error;
    this.listeners.forEach((listener) => listener());
  }

  /** Drop every load in flight (the list's query changed). */
  invalidate() {
    this.generation++;
    this.inFlight = false;
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

/**
 * Run one load of a shared list. `load` does the request and writes the
 * result to the store, but only while `isCurrent()` is true — after a newer
 * load or an `invalidate()`, it must write nothing (not even `loading:
 * false`). A failure is recorded on the status (`error`, `failed`) and
 * logged under `errorLabel` (`null`: `load` logs it already); the returned
 * promise never rejects. `kind` (default: "first" or "next") is kept as
 * `failedKind` when the load fails, for a retry that has to repeat the same
 * kind of load.
 */
export async function runSharedListLoad(
  status: SharedListStatus,
  first: boolean,
  load: (isCurrent: () => boolean) => Promise<void>,
  errorLabel: string | null,
  kind?: string,
): Promise<void> {
  const generation = ++status.generation;
  const isCurrent = () => generation === status.generation;
  status.inFlight = true;
  status.pendingReset = false;
  status.failed = null;
  status.failedKind = null;
  status.setError(null);
  try {
    await load(isCurrent);
  } catch (err) {
    if (!isCurrent()) return;
    status.failed = first ? "first" : "next";
    status.failedKind = kind ?? status.failed;
    status.setError(toError(err));
    if (errorLabel !== null) handleError(err, errorLabel);
  } finally {
    if (isCurrent()) status.inFlight = false;
  }
}
