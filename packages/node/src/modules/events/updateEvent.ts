import { SublayHttpClient } from "../../core/client";
import {
  Event,
  EventType,
  EventUpdateIncludeParam,
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

export interface UpdateEventProps {
  eventId: string;
  title?: string;
  description?: string;
  startTime?: string | Date; // ISO datetime string, or a Date
  endTime?: string | Date; // ISO datetime string, or a Date
  timezone?: string;
  type?: EventType;
  url?: string;
  venueName?: string;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  visibility?: EventVisibility;
  capacity?: number;
  allowMaybe?: boolean;
  guestListVisible?: boolean;
  metadata?: Record<string, any>;
  /**
   * A new cover image, replacing the current one. When present the request
   * is sent as `multipart/form-data`. Requires the `files-images` bundle.
   */
  coverFile?: ImageSlotFile;
  /**
   * Images APPENDED to the event's files, processed into sizes per `options` (`mode` is required).
   * Each carries its bytes and, for raw bytes, a `filename` and `mimeType`.
   * When present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files APPENDED to the event's files, stored as uploaded (`options.pathParts` optional). When
   * present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  files?: FileListUpload;
  /**
   * Ids of the event's files to remove: its images and/or the current cover
   * (`coverImageId`; removing it clears the cover). Each must be one of this
   * event's files, or the whole update is refused. Works with or without
   * uploads in the same request.
   */
  removeFileIds?: string[];
  /**
   * What the response adds: `"files"`, the event's files as they now are
   * (cover first) and the host's avatar and banner files. Without it the
   * response has no `files`, even after an upload or removal.
   */
  include?: EventUpdateIncludeParam;
  /**
   * The event host this request acts as. It has exactly that user's powers
   * on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
}

/**
 * Edits an event. Hosts only (403 `event/forbidden`), and on an event in a
 * space only while they are active members of it and not banned in it or a
 * space above it (403 `event/not-space-member`). The space's admins and
 * moderators can't edit events they don't host.
 */
export async function updateEvent(
  client: SublayHttpClient,
  data: UpdateEventProps
): Promise<Event> {
  const { eventId, coverFile, images, files, ...body } = data;
  const path = `/events/${eventId}`;

  if (coverFile || hasListUploads({ images, files })) {
    const formData = new FormData();
    // `include` as one comma-separated field.
    const { include, ...fields } = body;
    appendFields(formData, {
      ...fields,
      include: Array.isArray(include) ? include.join(",") : include,
    });
    if (coverFile) appendImageSlot(formData, "coverFile", coverFile, "cover");
    appendListUploads(formData, { images, files });
    const response = await client.projectInstance.patch<Event>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.patch<Event>(path, body);
  return response.data;
}
