import { useMemo, useSyncExternalStore } from "react";
import { useStore } from "react-redux";
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
    this.failed = null;
    this.setError(null);
  }
}

// Keyed by the Redux store, so two providers (or two tests) never share one.
const registry = new WeakMap<object, Map<string, SharedListStatus>>();

export function getSharedListStatus(store: object, key: string): SharedListStatus {
  let lists = registry.get(store);
  if (!lists) {
    lists = new Map();
    registry.set(store, lists);
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
  const store = useStore();
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
 * promise never rejects.
 */
export async function runSharedListLoad(
  status: SharedListStatus,
  first: boolean,
  load: (isCurrent: () => boolean) => Promise<void>,
  errorLabel: string | null,
): Promise<void> {
  const generation = ++status.generation;
  const isCurrent = () => generation === status.generation;
  status.inFlight = true;
  status.pendingReset = false;
  status.failed = null;
  status.setError(null);
  try {
    await load(isCurrent);
  } catch (err) {
    if (!isCurrent()) return;
    status.failed = first ? "first" : "next";
    status.setError(toError(err));
    if (errorLabel !== null) handleError(err, errorLabel);
  } finally {
    if (isCurrent()) status.inFlight = false;
  }
}
