import { SublayHttpClient } from "../../core/client";
import { Event, EventType, EventVisibility } from "../../interfaces/Event";
import {
  appendFields,
  appendImageSlot,
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
   * Ids of the event's files to remove: its images and/or the current cover
   * (`coverImageId`; removing it clears the cover). Each must be one of this
   * event's files, or the whole update is refused. Works with or without
   * uploads in the same request.
   */
  removeFileIds?: string[];
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
  const { eventId, coverFile, ...body } = data;
  const path = `/events/${eventId}`;

  if (coverFile) {
    const formData = new FormData();
    appendFields(formData, body);
    appendImageSlot(formData, "coverFile", coverFile, "cover");
    const response = await client.projectInstance.patch<Event>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.patch<Event>(path, body);
  return response.data;
}
