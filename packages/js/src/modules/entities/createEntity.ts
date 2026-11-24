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
} from "../../core/multipart";

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
  attachments?: Record<string, any>[];
  keywords?: string[];
  mentions?: Mention[];
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  nsfw?: boolean;
  isDraft?: boolean;
  /**
   * Images, processed into sizes per `options` (`mode` is required). When
   * present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files stored as uploaded (`options.pathParts` optional). When present the
   * request is sent as `multipart/form-data`. Requires the `files-images`
   * bundle.
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
    appendListUploads(formData, { images, files });
    // Object fields go as JSON strings (the server parses them back). On a
    // create a null field means the same as leaving it out.
    appendFields(formData, withoutNulls(body));
    const response = await client.projectInstance.post<Entity>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.post<Entity>(path, body);
  return response.data;
}
