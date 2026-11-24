import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";
import { Mention } from "../../interfaces/Mention";
import {
  appendFields,
  appendListUploads,
  hasListUploads,
  withoutNulls,
  type FileListUpload,
  type ImageListUpload,
} from "../../core/formData";

export interface CreateEntityProps {
  foreignId?: string;
  /**
   * Where the entity comes from (free text, e.g. `"blog"`). `"none"`,
   * `"null"` and `"undefined"` are reserved and refused. For no source, leave
   * it out or pass `null`.
   */
  sourceId?: string | null;
  spaceId?: string;
  title?: string;
  content?: string;
  attachments?: any[];
  keywords?: string[];
  mentions?: Mention[];
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  nsfw?: boolean;
  /**
   * The user the service key acts as, who authors the entity; the create runs
   * under that user's own checks. Omit it for an app-owned entity (no author).
   */
  actingUserId?: string;
  /** Save as a draft. A draft needs an owner, so this requires `actingUserId`. */
  isDraft?: boolean;
  /**
   * Backdate the entity (service key only, also with `actingUserId`): a
   * `Date`, or a full UTC timestamp string such as
   * `"2024-03-01T12:00:00.000Z"` (`date.toISOString()`). More than five
   * minutes in the future: 400 `entity/invalid-body`.
   */
  createdAt?: string | Date;
  /**
   * Backdate the entity's last update (service key only, also with
   * `actingUserId`); same format as `createdAt`. More than five minutes in
   * the future: 400 `entity/invalid-body`.
   */
  updatedAt?: string | Date;
  /**
   * Images on the entity, processed into sizes per `options` (`mode` is required).
   * Each carries its bytes and, for raw bytes, a `filename` and `mimeType`.
   * When present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files on the entity, stored as uploaded (`options.pathParts` optional). When
   * present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  files?: FileListUpload;
}

export async function createEntity(
  client: SublayHttpClient,
  data: CreateEntityProps
): Promise<Entity> {
  const path = `/entities`;
  const { images, files, ...body } = data;

  if (hasListUploads({ images, files })) {
    const formData = new FormData();
    // Object fields go as JSON strings (the server parses them back). On a
    // create a null field means the same as leaving it out.
    appendFields(formData, withoutNulls(body));
    appendListUploads(formData, { images, files });
    const response = await client.projectInstance.post<Entity>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.post<Entity>(path, body);
  return response.data;
}
