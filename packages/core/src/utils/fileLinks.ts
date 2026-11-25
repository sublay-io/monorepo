/**
 * v8 file links (S#144). Every link Sublay returns is signed and stops
 * working at an expiry: a File carries it as `linksExpireAt`, and a bare link
 * (a notification's `spaceAvatar`) carries it as its `exp` query parameter.
 * A fresh link comes from `POST /files/links`, by the file's id — which every
 * link holds as its second-to-last path segment.
 *
 * A File with no `linksExpireAt`, or a link with no `exp`, doesn't expire:
 * nothing to refresh.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** How long before its expiry a link counts as expired (client clock skew). */
export const FILE_LINK_REFRESH_MARGIN_MS = 5 * 60 * 1000;

function parse(link: string): URL | null {
  try {
    return new URL(link);
  } catch {
    return null;
  }
}

/** The file id a link names, or null when it names none. */
export function fileIdFromLink(link: string | null | undefined): string | null {
  if (!link) return null;
  const url = parse(link);
  if (!url) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  const id = segments.length >= 2 ? decodeURIComponent(segments[segments.length - 2]) : null;
  return id && UUID.test(id) ? id : null;
}

/** When a link stops working (ms since epoch), or null for a permanent one. */
export function linkExpiresAt(link: string | null | undefined): number | null {
  if (!link) return null;
  const exp = parse(link)?.searchParams.get("exp");
  return exp && /^\d+$/.test(exp) ? Number(exp) * 1000 : null;
}

/** When a File's links stop working (ms since epoch), or null for permanent. */
export function fileLinksExpireAt(
  file: { linksExpireAt?: string | null; originalPath?: string | null } | null | undefined
): number | null {
  if (!file) return null;
  if (file.linksExpireAt) {
    const t = Date.parse(file.linksExpireAt);
    if (!Number.isNaN(t)) return t;
  }
  return linkExpiresAt(file.originalPath);
}

/** True when links expiring at `expiresAt` should be refreshed now. */
export function linksNeedRefresh(expiresAt: number | null, now: number = Date.now()): boolean {
  return expiresAt !== null && expiresAt - FILE_LINK_REFRESH_MARGIN_MS <= now;
}

export function isFileId(id: string | null | undefined): id is string {
  return !!id && UUID.test(id);
}
