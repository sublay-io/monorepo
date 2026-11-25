import { useCallback, useEffect } from "react";
import { useSublayDispatch, useSublaySelector } from "../../store/hooks";
import useProject from "../projects/useProject";
import type { File as SublayFile } from "../../interfaces/models/File";
import { getFileLinkBatcher } from "../../helpers/fileLinkBatcher";
import {
  fileIdFromLink,
  fileLinksExpireAt,
  isFileId,
  linkExpiresAt,
  linksNeedRefresh,
} from "../../utils/fileLinks";

/**
 * A File, or anything shaped like one (a registry component's own narrower
 * type): what the hook needs is its `id`, `originalPath` and
 * `linksExpireAt`. A string is a bare link.
 */
export interface FileLinkCarrier {
  id?: string | null;
  originalPath?: string | null;
  linksExpireAt?: string | null;
}
type FileOrLink = FileLinkCarrier | SublayFile | string | null | undefined;

function idAndExpiry(input: FileOrLink): { id: string | null; expiresAt: number | null } {
  if (!input) return { id: null, expiresAt: null };
  if (typeof input === "string") return { id: fileIdFromLink(input), expiresAt: linkExpiresAt(input) };
  return { id: isFileId(input.id) ? input.id : null, expiresAt: fileLinksExpireAt(input) };
}

/**
 * The File (or bare link, such as a notification's `spaceAvatar`) to render,
 * with links that still work (S#144). File links expire 24–48 h after they
 * were read; when this one has (or is about to), the hook asks
 * `POST /files/links` for a fresh one, batched with every other image on the
 * screen, and re-renders with it. Until then it returns what it was given.
 *
 * A file the viewer can no longer see gets no fresh link: the old one is
 * returned and simply stops working. A File without `linksExpireAt` (and a
 * link without `exp`) never expires and is returned as is.
 */
export function useFileLinks<T extends FileOrLink>(input: T): T {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const { id, expiresAt } = idAndExpiry(input);
  const fresh = useSublaySelector((s) => (id ? s.sublay.fileLinks?.byId[id] : undefined));
  const unavailable = useSublaySelector((s) => (id ? !!s.sublay.fileLinks?.unavailable[id] : false));

  const freshExpiresAt = fileLinksExpireAt(fresh);
  const useFresh = !!fresh && freshExpiresAt !== null && (expiresAt === null || freshExpiresAt > expiresAt);
  const current: T = useFresh
    ? ((typeof input === "string" ? fresh!.originalPath : fresh) as T)
    : input;
  const currentExpiresAt = useFresh ? freshExpiresAt : expiresAt;

  const stale = linksNeedRefresh(currentExpiresAt);
  useEffect(() => {
    if (!stale || unavailable || !id || !projectId) return;
    getFileLinkBatcher(projectId, dispatch).request(id, `exp:${currentExpiresAt}`);
  }, [stale, unavailable, id, projectId, currentExpiresAt, dispatch]);

  return current;
}

/**
 * For an image's `onError`: asks once for a fresh link for this File (or
 * bare link), in case it expired earlier than the device clock thinks. Asked
 * at most once per link, so a file that is really gone isn't asked for again.
 */
export function useReportFileLoadError(): (input: FileOrLink) => void {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  return useCallback(
    (input: FileOrLink) => {
      const { id, expiresAt } = idAndExpiry(input);
      if (!id || !projectId) return;
      getFileLinkBatcher(projectId, dispatch).request(id, `error:${expiresAt}`);
    },
    [projectId, dispatch]
  );
}
