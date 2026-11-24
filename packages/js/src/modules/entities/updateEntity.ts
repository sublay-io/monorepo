import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";
import { Mention } from "../../interfaces/Mention";
import {
  appendFields,
  appendListUploads,
  hasListUploads,
  type FileListUpload,
  type ImageListUpload,
} from "../../core/multipart";

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
   * Ids of the entity's files to remove (ids in its `files`). Each must be one
   * of this entity's files, or the whole update is refused. Works alone or
   * with `images` / `files`.
   */
  removeFileIds?: string[];
  /**
   * Images APPENDED to the entity's files, processed into sizes per
   * `options` (`mode` is required). When present the request is sent as
   * `multipart/form-data`. Requires the `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files APPENDED to the entity's files, stored as uploaded. When present the
   * request is sent as `multipart/form-data`. Requires the `files-images`
   * bundle.
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
    appendListUploads(formData, { images, files });
    // Object fields (and `removeFileIds`) go as JSON strings; the server
    // parses them back.
    appendFields(formData, restOfProps);
    const response = await client.projectInstance.patch<Entity>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.patch<Entity>(
    path,
    restOfProps
  );
  return response.data;
}
