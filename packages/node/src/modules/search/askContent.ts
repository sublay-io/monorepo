import { isAxiosError } from "axios";
import { SublayHttpClient } from "../../core/client";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";
import { ContentSearchResult } from "./searchContent";

export interface AskContentProps extends SpaceReputationContextParams {
  query: string;
  sourceTypes?: ("entity" | "comment" | "message")[];
  spaceId?: string;
  /**
   * With a `spaceId`, also search every space nested under it (children,
   * grandchildren — the whole subtree, any depth). Ignored without a `spaceId`.
   * Defaults to false (exact-space search).
   */
  includeChildSpaces?: boolean;
  conversationId?: string;
  limit?: number;
  /**
   * The user to search as: the result is exactly what their own access token
   * would get (their chats, their blocks, the moderation details they may
   * see). Without it, the anonymous view: no chat messages, no block
   * filtering, no comment moderation details.
   */
  actingUserId?: string;
  /** Abort the in-flight stream. */
  signal?: AbortSignal;
}

/**
 * One Server-Sent Event of the `askContent` stream.
 * - `token`   — the next piece of the answer text.
 * - `sources` — the records the answer drew on, once, after the answer.
 * - `done`    — the answer finished.
 * - `error`   — the server failed after the stream opened; the stream ends.
 */
export type AskContentEvent =
  | { type: "token"; content: string }
  | { type: "sources"; sources: ContentSearchResult[] }
  | { type: "done" }
  | { type: "error"; error: string; code: string };

function parseEvent(block: string): AskContentEvent | null {
  let event = "message";
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }

  let payload: any;
  try {
    payload = data ? JSON.parse(data) : undefined;
  } catch {
    payload = undefined;
  }

  switch (event) {
    case "token":
      return { type: "token", content: payload?.content ?? "" };
    case "sources":
      return { type: "sources", sources: Array.isArray(payload) ? payload : [] };
    case "done":
      return { type: "done" };
    case "error":
      return {
        type: "error",
        error: payload?.error ?? "Unknown error",
        code: payload?.code ?? "search/server-error",
      };
    default:
      return null;
  }
}

async function readAll(stream: AsyncIterable<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let text = "";
  for await (const chunk of stream) text += decoder.decode(chunk, { stream: true });
  return text + decoder.decode();
}

/**
 * Ask a question over your project's content. The server streams the answer
 * as Server-Sent Events, so this is an async generator: iterate it to read the
 * answer as it arrives.
 *
 * ```ts
 * let answer = "";
 * for await (const ev of sublay.search.askContent({ query: "How do refunds work?" })) {
 *   if (ev.type === "token") answer += ev.content;
 *   else if (ev.type === "sources") console.log(ev.sources);
 *   else if (ev.type === "error") throw new Error(ev.error);
 * }
 * ```
 *
 * A request the server refuses before the stream opens (no paid plan, an
 * invalid body, a rate limit) throws, like every other call, with the JSON
 * error body on `err.response.data`. Stop early with `break` or `signal`.
 */
export async function* askContent(
  client: SublayHttpClient,
  data: AskContentProps
): AsyncGenerator<AskContentEvent, void, unknown> {
  const { signal, spaceReputation, ...body } = data;

  let stream: AsyncIterable<Uint8Array> & { destroy?: () => void };
  try {
    // Every field goes in the body on a POST, the space-reputation options too.
    const response = await client.projectInstance.post(
      "/search/ask",
      { ...body, ...buildSpaceReputationParams({ spaceReputation }) },
      { responseType: "stream", signal }
    );
    stream = response.data;
  } catch (err) {
    // A refused request's body arrives as a stream too: read it back to the
    // JSON error body every other call exposes.
    if (isAxiosError(err) && err.response?.data && typeof err.response.data[Symbol.asyncIterator] === "function") {
      const text = await readAll(err.response.data);
      try {
        err.response.data = JSON.parse(text);
      } catch {
        err.response.data = text;
      }
    }
    throw err;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for await (const chunk of stream) {
      buffer += decoder.decode(chunk, { stream: true });
      // Events are separated by a blank line.
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const event = parseEvent(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (event) yield event;
      }
    }
    const tail = (buffer + decoder.decode()).trim();
    if (tail) {
      const event = parseEvent(tail);
      if (event) yield event;
    }
  } finally {
    // Close the connection when the caller stops early.
    stream.destroy?.();
  }
}
