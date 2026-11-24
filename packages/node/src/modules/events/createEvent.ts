import { SublayHttpClient } from "../../core/client";
import {
  Event,
  EventType,
  EventVisibility,
} from "../../interfaces/Event";
import {
  appendFields,
  appendImageSlot,
  appendListUploads,
  hasListUploads,
  type FileListUpload,
  type ImageListUpload,
  type ImageSlotFile,
} from "../../core/formData";

export interface CreateEventProps {
  title: string;
  description?: string;
  startTime: string | Date; // ISO datetime string, or a Date
  endTime?: string | Date; // ISO datetime string, or a Date
  timezone?: string;
  type: EventType;
  url?: string;
  venueName?: string;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  spaceId?: string;
  visibility?: EventVisibility; // defaults to "public" server-side
  capacity?: number;
  allowMaybe?: boolean;
  guestListVisible?: boolean;
  hostIds?: string[];
  metadata?: Record<string, any>;
  /**
   * The cover image (one image, processed per `options`). When present the
   * request is sent as `multipart/form-data`. Its file is returned in the
   * event's `files`, and `coverImageId` points at it. Requires the
   * `files-images` bundle.
   */
  coverFile?: ImageSlotFile;
  /**
   * Images in the event's files, processed into sizes per `options` (`mode` is required).
   * Each carries its bytes and, for raw bytes, a `filename` and `mimeType`.
   * When present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files in the event's files, stored as uploaded (`options.pathParts` optional). When
   * present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  files?: FileListUpload;
  /**
   * The user the service key acts as: the event's creator, who is
   * auto-added to `hostIds`. Held to that user's own permissions (in a space,
   * they must be an active member).
   */
  actingUserId: string;
}

export async function createEvent(
  client: SublayHttpClient,
  data: CreateEventProps
): Promise<Event> {
  const { coverFile, images, files, ...body } = data;

  if (coverFile || hasListUploads({ images, files })) {
    const formData = new FormData();
    appendFields(formData, body);
    if (coverFile) appendImageSlot(formData, "coverFile", coverFile, "cover");
    appendListUploads(formData, { images, files });
    const response = await client.projectInstance.post<Event>(`/events`, formData);
    return response.data;
  }

  const response = await client.projectInstance.post<Event>(`/events`, body);
  return response.data;
}
