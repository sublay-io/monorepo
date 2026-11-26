import { describe, it, expect, afterEach } from "vitest";
import axios, { CanceledError } from "axios";

import {
  resetAxiosMocks,
  stubAxiosAdapter,
  okAxiosResponse,
  axiosErrorWithStatus,
} from "../test-utils";
import { SublayError } from "../errors/SublayError";
import axiosPublic, { axiosPrivate, BASE_URL, REQUEST_TIMEOUT_MS } from "./axios";

afterEach(() => {
  resetAxiosMocks();
});

describe("config/axios", () => {
  it("configures the public instance with the API base URL", () => {
    expect(axiosPublic.defaults.baseURL).toBe(BASE_URL);
  });

  it("configures axiosPrivate with the same base URL and a JSON content type", () => {
    expect(axiosPrivate.defaults.baseURL).toBe(BASE_URL);
    expect(axiosPrivate.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("exposes two distinct instances", () => {
    expect(axiosPrivate).not.toBe(axiosPublic);
  });

  it("gives the public instance a finite request timeout", () => {
    // Without one, a connection that is accepted and never answered leaves the
    // promise pending forever. On the credential-exchange path that pins the
    // single-flight entry and the lease permanently: the account cannot be
    // switched into again without an app restart.
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    expect(Number.isFinite(REQUEST_TIMEOUT_MS)).toBe(true);
    expect(axiosPublic.defaults.timeout).toBe(REQUEST_TIMEOUT_MS);
  });

  it("carries that timeout into every request the public instance issues", () => {
    // The default is only worth anything if axios merges it into the per-request
    // config the adapter enforces. Asserted through a real request so the
    // instance default and the request that actually goes out cannot drift.
    let seen: unknown;
    stubAxiosAdapter(axiosPublic, async (config) => {
      seen = config.timeout;
      return okAxiosResponse({}, 200, config);
    });

    return axiosPublic.get("/anything").then(() => {
      expect(seen).toBe(REQUEST_TIMEOUT_MS);
    });
  });

  describe("failures reject as SublayError", () => {
    it.each([
      ["axiosPrivate", axiosPrivate],
      ["the public instance", axiosPublic],
    ])("%s: an error response carries the server's code, param and status", async (_, instance) => {
      let raw: unknown;
      stubAxiosAdapter(instance, async (config) => {
        raw = axiosErrorWithStatus(422, { error: "Too long.", code: "x/too-long", param: "title" }, config);
        throw raw;
      });

      const err = await instance.post("/x", {}).catch((e: unknown) => e);

      expect(err).toBeInstanceOf(SublayError);
      expect(err).toMatchObject({ message: "Too long.", code: "x/too-long", param: "title", status: 422 });
      expect((err as SublayError).cause).toBe(raw);
    });

    it("an aborted request keeps its name, and its cause is the axios cancel", async () => {
      stubAxiosAdapter(axiosPrivate, async () => {
        throw new CanceledError();
      });

      const err = await axiosPrivate.get("/x").catch((e: unknown) => e);

      expect(err).toBeInstanceOf(SublayError);
      expect((err as SublayError).name).toBe("CanceledError");
      expect((err as SublayError).code).toBeUndefined();
      expect(axios.isCancel((err as SublayError).cause)).toBe(true);
    });
  });
});
