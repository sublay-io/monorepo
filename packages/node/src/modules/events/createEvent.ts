import { SublayHttpClient } from "../../core/client";
import {
  Event,
  EventType,
  EventVisibility,
} from "../../interfaces/Event";
import {
  appendFields,
  appendImageSlot,
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
  const { coverFile, ...body } = data;

  if (coverFile) {
    const formData = new FormData();
    appendFields(formData, body);
    appendImageSlot(formData, "coverFile", coverFile, "cover");
    const response = await client.projectInstance.post<Event>(`/events`, formData);
    return response.data;
  }

  const response = await client.projectInstance.post<Event>(`/events`, body);
  return response.data;
}
