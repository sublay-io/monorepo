import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  makeRtkQueryStore,
  type FetchMockHandle,
} from "../../test-utils";
import { useFileLinks, useReportFileLoadError } from "./useFileLinks";
import { resetFileLinkBatchers } from "../../helpers/fileLinkBatcher";
import { resetAccountScopedState } from "../../store/actions";
import {
  fileIdFromLink,
  fileLinksExpireAt,
  linkExpiresAt,
  linksNeedRefresh,
  FILE_LINK_REFRESH_MARGIN_MS,
} from "../../utils/fileLinks";
import type { File as SublayFile } from "../../interfaces/models/File";

const ID = "9a1b2c3d-0000-4000-8000-000000000001";
const ID2 = "9a1b2c3d-0000-4000-8000-000000000002";
const HOUR = 3600_000;

function link(id: string, expMs: number): string {
  return `https://api.sublay.io/files/p/files/${id}/photo.jpg?exp=${Math.floor(expMs / 1000)}&sig=abc`;
}

function file(id: string, expMs: number): SublayFile {
  return {
    id,
    userId: null,
    entityId: null,
    eventId: null,
    commentId: null,
    chatMessageId: null,
    spaceId: null,
    type: "image",
    originalPath: link(id, expMs),
    originalSize: 1,
    originalMimeType: "image/webp",
    position: 0,
    metadata: {},
    image: null,
    linksExpireAt: new Date(Math.floor(expMs / 1000) * 1000).toISOString(),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("file link helpers", () => {
  it("read the file id and expiry from a link", () => {
    const exp = Date.now() + HOUR;
    expect(fileIdFromLink(link(ID, exp))).toBe(ID);
    expect(linkExpiresAt(link(ID, exp))).toBe(Math.floor(exp / 1000) * 1000);
    expect(fileIdFromLink("https://x.test/files/p/not-a-uuid/a.jpg")).toBeNull();
    expect(fileIdFromLink("not a url")).toBeNull();
  });

  it("a File or link without an expiry is permanent", () => {
    const permanent = "https://api.sublay.io/internal/files/p/files/x/a.jpg";
    expect(linkExpiresAt(permanent)).toBeNull();
    expect(fileLinksExpireAt({ originalPath: permanent, linksExpireAt: undefined })).toBeNull();
    expect(linksNeedRefresh(null)).toBe(false);
  });

  it("links count as expired a few minutes early (clock skew)", () => {
    const now = Date.now();
    expect(linksNeedRefresh(now + FILE_LINK_REFRESH_MARGIN_MS + 1000, now)).toBe(false);
    expect(linksNeedRefresh(now + FILE_LINK_REFRESH_MARGIN_MS - 1000, now)).toBe(true);
  });
});

describe("useFileLinks", () => {
  let fetch: FetchMockHandle;

  beforeEach(() => {
    resetFileLinkBatchers();
    fetch = stubFetchMock();
  });
  afterEach(() => {
    unstubFetchMock();
  });

  it("a File whose links still work is returned as is, with no request", async () => {
    const f = file(ID, Date.now() + 24 * HOUR);
    const { result } = renderHookWithStore(() => useFileLinks(f));
    expect(result.current).toBe(f);
    await new Promise((r) => setTimeout(r, 100));
    expect(fetch.calls()).toHaveLength(0);
  });

  it("expired Files are refreshed in one batch, and replaced once the fresh ones arrive", async () => {
    const old1 = file(ID, Date.now() - HOUR);
    const old2 = file(ID2, Date.now() - HOUR);
    const fresh1 = file(ID, Date.now() + 30 * HOUR);
    const fresh2 = file(ID2, Date.now() + 30 * HOUR);
    fetch.fetchMock.mockResolvedValue(jsonResponse({ files: [fresh1, fresh2] }));

    const store = makeRtkQueryStore();
    const a = renderHookWithStore(() => useFileLinks(old1), { store });
    const b = renderHookWithStore(() => useFileLinks(old2), { store });
    expect(a.result.current).toBe(old1);

    await waitFor(() => expect(a.result.current.originalPath).toBe(fresh1.originalPath));
    await waitFor(() => expect(b.result.current.originalPath).toBe(fresh2.originalPath));
    const calls = fetch.calls();
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/test-project/files/links");
    expect(calls[0].method).toBe("POST");
    expect(JSON.parse(calls[0].body as string).fileIds.sort()).toEqual([ID, ID2].sort());
  });

  it("a bare link (a notification's spaceAvatar) is refreshed by the id it names", async () => {
    const fresh = file(ID, Date.now() + 30 * HOUR);
    fetch.fetchMock.mockResolvedValue(jsonResponse({ files: [fresh] }));
    const { result } = renderHookWithStore(() => useFileLinks(link(ID, Date.now() - HOUR)));
    await waitFor(() => expect(result.current).toBe(fresh.originalPath));
  });

  it("a file the server leaves out is asked for once, and the old link is kept", async () => {
    fetch.fetchMock.mockResolvedValue(jsonResponse({ files: [] }));
    const old = file(ID, Date.now() - HOUR);
    const store = makeRtkQueryStore();
    const { result, rerender } = renderHookWithStore(() => useFileLinks(old), { store });
    await waitFor(() => expect(fetch.calls()).toHaveLength(1));
    rerender();
    renderHookWithStore(() => useFileLinks(old), { store });
    await new Promise((r) => setTimeout(r, 150));
    expect(fetch.calls()).toHaveLength(1);
    expect(result.current).toBe(old);
    expect(store.getState().sublay.fileLinks.unavailable[ID]).toBe(old.originalPath);
  });

  it("after an account change, a file the last account couldn't see is asked for again", async () => {
    const fresh = file(ID, Date.now() + 30 * HOUR);
    fetch.fetchMock
      .mockResolvedValueOnce(jsonResponse({ files: [] }))
      .mockResolvedValueOnce(jsonResponse({ files: [fresh] }));
    const old = file(ID, Date.now() - HOUR);
    const store = makeRtkQueryStore();
    const { result } = renderHookWithStore(() => useFileLinks(old), { store });
    await waitFor(() => expect(store.getState().sublay.fileLinks.unavailable[ID]).toBe(old.originalPath));

    act(() => {
      store.dispatch(resetAccountScopedState());
    });

    await waitFor(() => expect(result.current.originalPath).toBe(fresh.originalPath));
    expect(fetch.calls()).toHaveLength(2);
  });

  it("the same window signed again (a changed signing secret) replaces a link that fails to load", async () => {
    const exp = Date.now() + 24 * HOUR;
    const f = file(ID, exp);
    const resigned = { ...file(ID, exp), originalPath: f.originalPath.replace("sig=abc", "sig=new") };
    fetch.fetchMock.mockResolvedValue(jsonResponse({ files: [resigned] }));
    const store = makeRtkQueryStore();
    const links = renderHookWithStore(() => useFileLinks(f), { store });
    const report = renderHookWithStore(() => useReportFileLoadError(), { store });
    act(() => report.result.current(f));
    await waitFor(() => expect(links.result.current.originalPath).toBe(resigned.originalPath));
  });

  it("a refused link isn't asked about again, but a newer link for the same file is", async () => {
    fetch.fetchMock.mockResolvedValue(jsonResponse({ files: [] }));
    const store = makeRtkQueryStore();
    const old = file(ID, Date.now() - HOUR);
    renderHookWithStore(() => useFileLinks(old), { store });
    await waitFor(() => expect(fetch.calls()).toHaveLength(1));
    // A newer read of the record (the viewer regained access) brings a new link.
    const reread = { ...file(ID, Date.now() - 1000), originalPath: link(ID, Date.now() - 1000).replace("sig=abc", "sig=re") };
    renderHookWithStore(() => useFileLinks(reread), { store });
    await waitFor(() => expect(fetch.calls()).toHaveLength(2));
  });

  it("a failed request doesn't loop", async () => {
    fetch.fetchMock.mockResolvedValue(jsonResponse({ code: "rate-limit" }, 429));
    renderHookWithStore(() => useFileLinks(file(ID, Date.now() - HOUR)));
    await waitFor(() => expect(fetch.calls()).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 300));
    expect(fetch.calls()).toHaveLength(1);
  });

  it("a load error asks once for a fresh link, even before the device thinks it expired", async () => {
    const f = file(ID, Date.now() + 24 * HOUR);
    const fresh = file(ID, Date.now() + 40 * HOUR);
    fetch.fetchMock.mockResolvedValue(jsonResponse({ files: [fresh] }));
    const store = makeRtkQueryStore();
    const links = renderHookWithStore(() => useFileLinks(f), { store });
    const report = renderHookWithStore(() => useReportFileLoadError(), { store });
    act(() => {
      report.result.current(f);
      report.result.current(f);
    });
    await waitFor(() => expect(links.result.current.originalPath).toBe(fresh.originalPath));
    expect(fetch.calls()).toHaveLength(1);
  });

  it("a permanent File is never refreshed on its own", async () => {
    const f = { ...file(ID, Date.now()), originalPath: "https://api.sublay.io/internal/files/p/x/a.jpg", linksExpireAt: undefined };
    renderHookWithStore(() => useFileLinks(f));
    await new Promise((r) => setTimeout(r, 100));
    expect(fetch.calls()).toHaveLength(0);
  });
});
