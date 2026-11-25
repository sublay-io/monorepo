import { fileLinksApi } from "../store/api/fileLinksApi";
import { fileLinksRefreshed, fileLinksUnavailable } from "../store/slices/fileLinksSlice";

/**
 * Collects the file ids whose links need refreshing (S#144) and asks
 * `POST /files/links` for them in batches. One batcher per project.
 *
 * Bounded by design, so a broken image can never turn into a flood:
 * - each id is asked for at most once per `reason` (the link it was asked
 *   about, as expired or as failing to load, within one account), so a
 *   different link is needed before it's asked again;
 * - a link the server won't refresh is marked unavailable and never asked
 *   about again;
 * - a failed request (rate limit, network) is retried once, after a pause,
 *   and then given up for those ids.
 */

const BATCH_DELAY_MS = 50;
const BATCH_MAX_IDS = 100;
const RETRY_DELAY_MS = 5000;

type Dispatch = (action: any) => any;

class FileLinkBatcher {
  private asked = new Set<string>();
  /** id → the link it was asked about, for marking it unavailable. */
  private queue = new Map<string, string | null>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retries = new Set<ReturnType<typeof setTimeout>>();
  dispatch: Dispatch;

  constructor(private projectId: string, dispatch: Dispatch) {
    this.dispatch = dispatch;
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    for (const retry of this.retries) clearTimeout(retry);
    this.retries.clear();
  }

  request(fileId: string, reason: string, link: string | null): void {
    const key = `${fileId}|${reason}`;
    if (this.asked.has(key)) return;
    this.asked.add(key);
    this.queue.set(fileId, link);
    if (!this.timer) this.timer = setTimeout(() => this.flush(), BATCH_DELAY_MS);
  }

  private flush(): void {
    this.timer = null;
    const entries = [...this.queue];
    this.queue.clear();
    for (let i = 0; i < entries.length; i += BATCH_MAX_IDS) {
      void this.send(new Map(entries.slice(i, i + BATCH_MAX_IDS)), 0);
    }
  }

  private async send(batch: Map<string, string | null>, attempt: number): Promise<void> {
    const fileIds = [...batch.keys()];
    try {
      const { files } = await this.dispatch(
        fileLinksApi.endpoints.refreshFileLinks.initiate(
          { projectId: this.projectId, fileIds },
          // Nothing reads the mutation's state: don't keep every answer in the cache.
          { track: false }
        )
      ).unwrap();
      this.dispatch(fileLinksRefreshed(files));
      const returned = new Set(files.map((f: { id: string }) => f.id));
      const missing = fileIds
        .filter((id) => !returned.has(id))
        .map((id) => ({ id, link: batch.get(id) ?? null }));
      if (missing.length) this.dispatch(fileLinksUnavailable(missing));
    } catch {
      if (attempt === 0) {
        const retry = setTimeout(() => {
          this.retries.delete(retry);
          void this.send(batch, 1);
        }, RETRY_DELAY_MS);
        this.retries.add(retry);
      }
    }
  }
}

const batchers = new Map<string, FileLinkBatcher>();

export function getFileLinkBatcher(projectId: string, dispatch: Dispatch): FileLinkBatcher {
  let batcher = batchers.get(projectId);
  if (!batcher) {
    batcher = new FileLinkBatcher(projectId, dispatch);
    batchers.set(projectId, batcher);
  } else {
    batcher.dispatch = dispatch;
  }
  return batcher;
}

/** Tests only: forget every batcher. */
export function resetFileLinkBatchers(): void {
  for (const batcher of batchers.values()) batcher.stop();
  batchers.clear();
}
