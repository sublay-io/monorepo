import React from "react";
import { vi, type Mock } from "vitest";
import {
  renderHook,
  type RenderHookOptions,
  type RenderHookResult,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import { sublayReducers } from "../store/sublayReducers";
import { baseApi } from "../store/api/baseApi";
import {
  SublayContext,
  type SublayContextValues,
} from "../context/sublay-context";

/**
 * jsdom swaps in its own AbortController whose AbortSignal node's undici
 * `Request` rejects. RTK Query's fetchBaseQuery builds `new Request(url, {
 * signal })` before calling fetch, so the query throws at construction. Shim
 * Request to a lenient passthrough that just carries url/method (the signal
 * is irrelevant to these tests).
 */
class TestRequest {
  url: string;
  method: string;
  headers: unknown;
  private init: Record<string, unknown>;
  constructor(input: unknown, init: Record<string, unknown> = {}) {
    const base = (typeof input === "string" ? { url: input } : input) as {
      url: string;
      method?: string;
      headers?: unknown;
      init?: Record<string, unknown>;
    };
    this.url = base.url;
    this.init = { ...(base.init ?? {}), ...init };
    this.method = (this.init.method as string) ?? base.method ?? "GET";
    this.headers = this.init.headers ?? base.headers;
  }
  /** The body fetchBaseQuery built the request with (already serialized). */
  get body(): unknown {
    return this.init.body;
  }
  clone() {
    return new TestRequest(this);
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export interface FetchCallRecord {
  url: string;
  method: string;
  /** The request body as sent (a JSON string for a JSON request). */
  body: unknown;
  /** The request's `Content-Type` header, when it set one. */
  contentType: string | null;
}

export interface FetchMockHandle {
  fetchMock: Mock;
  calls: () => FetchCallRecord[];
}

/**
 * Stubs the global `fetch`/`Request` for RTK-Query-backed hook tests. Call
 * from `beforeEach`; pair with `unstubFetchMock` in `afterEach`. The returned
 * `fetchMock` is a plain `vi.fn()` — configure per-test behavior on it with
 * `mockImplementation`/`mockResolvedValueOnce`, building responses with
 * `jsonResponse`.
 */
export function stubFetchMock(
  implementation: (...args: unknown[]) => Promise<Response> = async () =>
    jsonResponse({}, 404),
): FetchMockHandle {
  vi.stubGlobal("Request", TestRequest);
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal("fetch", fetchMock);

  return {
    fetchMock,
    calls() {
      return fetchMock.mock.calls.map((args: unknown[]) => {
        const req = args[0] as Request | string;
        const url = typeof req === "string" ? req : req.url;
        const method =
          (typeof req === "string"
            ? (args[1] as RequestInit | undefined)?.method
            : (req as Request).method) ?? "GET";
        const init =
          typeof req === "string" ? (args[1] as RequestInit | undefined) : undefined;
        const body =
          typeof req === "string" ? init?.body : (req as unknown as TestRequest).body;
        const rawHeaders =
          typeof req === "string" ? init?.headers : (req as Request).headers;
        const contentType =
          rawHeaders instanceof Headers
            ? rawHeaders.get("content-type")
            : ((rawHeaders as Record<string, string> | undefined)?.["content-type"] ?? null);
        return { url, method, body, contentType };
      });
    },
  };
}

/** Restores the real global `fetch`/`Request`. Call from `afterEach`. */
export function unstubFetchMock(): void {
  vi.unstubAllGlobals();
}

export function makeRtkQueryStore() {
  return configureStore({
    reducer: {
      sublay: sublayReducers,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (gdm) =>
      gdm({ serializableCheck: false, immutableCheck: false }).concat(
        baseApi.middleware,
      ),
  });
}

export type RtkQueryStore = ReturnType<typeof makeRtkQueryStore>;

export interface RenderHookWithStoreOptions<Props>
  extends Omit<RenderHookOptions<Props>, "wrapper"> {
  projectId?: string;
  project?: SublayContextValues["project"];
  /** Reuse an existing store (e.g. to dispatch/read state across renders or hooks). */
  store?: RtkQueryStore;
}

export interface RenderHookWithStoreResult<Result, Props>
  extends RenderHookResult<Result, Props> {
  store: RtkQueryStore;
}

/**
 * Renders an RTK-Query-backed core hook wrapped in `SublayContext` plus a
 * real store (`sublayReducers` + `baseApi`). One store is created per call
 * and held stable across re-renders — recreating it on every render would
 * wipe RTK Query's cache. Pair with `stubFetchMock` to control the network.
 */
export function renderHookWithStore<Result, Props>(
  callback: (props: Props) => Result,
  options: RenderHookWithStoreOptions<Props> = {},
): RenderHookWithStoreResult<Result, Props> {
  const {
    projectId = "test-project",
    project = null,
    store = makeRtkQueryStore(),
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <SublayContext.Provider
          value={{ projectId, project } as SublayContextValues}
        >
          {children}
        </SublayContext.Provider>
      </Provider>
    );
  }

  const rendered = renderHook(callback, { wrapper: Wrapper, ...renderOptions });
  return { ...rendered, store };
}
