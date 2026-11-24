import { SublayHttpClient } from "../../core/client";
import { Entity, EntityUpdateIncludeParam } from "../../interfaces/Entity";
import { Mention } from "../../interfaces/Mention";
import {
  appendFields,
  appendListUploads,
  hasListUploads,
  type FileListUpload,
  type ImageListUpload,
} from "../../core/formData";

export interface UpdateEntityProps {
  entityId: string;
  title?: string;
  content?: string;
  attachments?: Record<string, any>[];
  keywords?: string[];
  mentions?: Mention[];
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  nsfw?: boolean;
  /**
   * The user this edit acts as (service key only). Required when the entity
   * has an author: name the author, and the request runs exactly as their own
   * access token's. Omit it only for an app-owned entity (no author).
   */
  actingUserId?: string;
  /**
   * Ids of the entity's files to remove (ids in its `files`). Each must be one
   * of this entity's files, or the whole update is refused. Works alone or
   * with `images` / `files`.
   */
  removeFileIds?: string[];
  /**
   * What the response adds: `"files"`, the entity's files as they now are.
   * Without it the response has no `files`, even after an upload or removal.
   */
  include?: EntityUpdateIncludeParam;
  /**
   * Images APPENDED to the entity's files, processed into sizes per `options` (`mode` is required).
   * Each carries its bytes and, for raw bytes, a `filename` and `mimeType`.
   * When present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files APPENDED to the entity's files, stored as uploaded (`options.pathParts` optional). When
   * present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  files?: FileListUpload;
}

export async function updateEntity(
  client: SublayHttpClient,
  data: UpdateEntityProps
): Promise<Entity> {
  const { entityId, images, files, ...restOfProps } = data;
  const path = `/entities/${entityId}`;

  if (hasListUploads({ images, files })) {
    const formData = new FormData();
    // Object fields (and `removeFileIds`) go as JSON strings; the server
    // parses them back.
    // `include` as one comma-separated field.
    const { include, ...fields } = restOfProps;
    appendFields(formData, {
      ...fields,
      include: Array.isArray(include) ? include.join(",") : include,
    });
    appendListUploads(formData, { images, files });
    const response = await client.projectInstance.patch<Entity>(path, formData);
    return response.data;
  }
  const response = await client.projectInstance.patch<Entity>(
    path,
    restOfProps
  );
  return response.data;
}
