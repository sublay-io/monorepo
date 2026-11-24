import { SublayHttpClient } from "../../core/client";
import {
  Event,
  EventType,
  EventUpdateIncludeParam,
  EventVisibility,
} from "../../interfaces/Event";
import {
  appendField,
  appendFields,
  appendFile,
  appendListUploads,
  hasListUploads,
  type FileListUpload,
  type ImageListUpload,
} from "../../core/multipart";
import type { EventCoverUpload } from "./createEvent";

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
   * Ids of the event's files to remove: list files and/or the current cover
   * (`coverImageId`; removing it clears the cover). Each must be one of this
   * event's files, or the whole update is refused. Works alone or with
   * `images` / `files` (append) and `coverFile` (replace).
   */
  removeFileIds?: string[];
  /**
   * What the response adds: `"files"`, the event's files as they now are
   * (cover first) and the host's avatar and banner files. Without it the
   * response has no `files`, even after an upload or removal.
   */
  include?: EventUpdateIncludeParam;
  /**
   * New cover image (one image) — REPLACES the existing cover. When present the
   * request is sent as `multipart/form-data`. Requires the `files-images` bundle.
   */
  coverFile?: EventCoverUpload;
  /**
   * Images APPENDED to the event's files, processed into sizes per `options`
   * (`mode` is required). When present the request is sent as
   * `multipart/form-data`. Requires the `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files APPENDED to the event's files, stored as uploaded. When present the
   * request is sent as `multipart/form-data`. Requires the `files-images`
   * bundle.
   */
  files?: FileListUpload;
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

  const hasCover = !!coverFile;

  if (hasCover || hasListUploads({ images, files })) {
    const formData = new FormData();

    if (coverFile) {
      appendFile(formData, "coverFile", coverFile.file, { fallback: "cover" });
      appendField(formData, "coverFile.options", coverFile.options);
    }
    appendListUploads(formData, { images, files });

    // `include` as one comma-separated field (a JSON array isn't read).
    const { include, ...fields } = body;
    appendFields(formData, {
      ...fields,
      include: Array.isArray(include) ? include.join(",") : include,
    });

    const response = await client.projectInstance.patch<Event>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.patch<Event>(path, body);
  return response.data;
}
