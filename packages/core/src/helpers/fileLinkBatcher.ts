import { fileLinksApi } from "../store/api/fileLinksApi";
import { fileLinksRefreshed, fileLinksUnavailable } from "../store/slices/fileLinksSlice";

/**
 * Collects the file ids whose links need refreshing (S#144) and asks
 * `POST /files/links` for them in batches. One batcher per project.
 *
 * Bounded by design, so a broken image can never turn into a flood:
 * - each id is asked for at most once per `reason` (its expiry, or a load
 *   error at that expiry, within one account), so a fresh link is needed
 *   before it's asked again;
 * - an id the server leaves out is marked unavailable and never asked again;
 * - a failed request (rate limit, network) is retried once, after a pause,
 *   and then given up for those ids.
 */

const BATCH_DELAY_MS = 50;
const BATCH_MAX_IDS = 100;
const RETRY_DELAY_MS = 5000;

type Dispatch = (action: any) => any;

class FileLinkBatcher {
  private asked = new Set<string>();
  private queue = new Set<string>();
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

  request(fileId: string, reason: string): void {
    const key = `${fileId}|${reason}`;
    if (this.asked.has(key)) return;
    this.asked.add(key);
    this.queue.add(fileId);
    if (!this.timer) this.timer = setTimeout(() => this.flush(), BATCH_DELAY_MS);
  }

  private flush(): void {
    this.timer = null;
    const ids = [...this.queue];
    this.queue.clear();
    for (let i = 0; i < ids.length; i += BATCH_MAX_IDS) {
      void this.send(ids.slice(i, i + BATCH_MAX_IDS), 0);
    }
  }

  private async send(fileIds: string[], attempt: number): Promise<void> {
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
      const missing = fileIds.filter((id) => !returned.has(id));
      if (missing.length) this.dispatch(fileLinksUnavailable(missing));
    } catch {
      if (attempt === 0) {
        const retry = setTimeout(() => {
          this.retries.delete(retry);
          void this.send(fileIds, 1);
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
