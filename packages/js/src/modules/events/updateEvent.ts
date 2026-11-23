import { SublayHttpClient } from "../../core/client";
import { Event, EventType, EventVisibility } from "../../interfaces/Event";
import { appendField, appendFields, appendFile } from "../../core/multipart";
import type { EventCoverUpload, EventGalleryUpload } from "./createEvent";

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
   * Ids of the event's files to remove: gallery images and/or the current
   * cover (`coverImageId`; removing it clears the cover). Each must be one of
   * this event's files, or the whole update is refused. Works alone or with
   * `gallery` (append) and `coverFile` (replace).
   */
  removeFileIds?: string[];
  /**
   * New cover image (one image) — REPLACES the existing cover. When present the
   * request is sent as `multipart/form-data`. Requires the `files-images` bundle.
   */
  coverFile?: EventCoverUpload;
  /**
   * Gallery images (multi) — APPENDED to the event's existing images. When
   * present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  gallery?: EventGalleryUpload;
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
  const { eventId, coverFile, gallery, ...body } = data;
  const path = `/events/${eventId}`;

  const hasCover = !!coverFile;
  const hasGallery = !!gallery && gallery.files.length > 0;

  if (hasCover || hasGallery) {
    const formData = new FormData();

    if (coverFile) {
      appendFile(formData, "coverFile", coverFile.file, { fallback: "cover" });
      appendField(formData, "coverFile.options", coverFile.options);
    }
    if (hasGallery) {
      gallery!.files.forEach((file) =>
        appendFile(formData, "gallery", file, { fallback: "gallery" })
      );
      appendField(formData, "gallery.options", gallery!.options);
    }

    appendFields(formData, body);

    const response = await client.projectInstance.patch<Event>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.patch<Event>(path, body);
  return response.data;
}
