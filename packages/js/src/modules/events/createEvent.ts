import { SublayHttpClient } from "../../core/client";
import { Event, EventType, EventVisibility } from "../../interfaces/Event";
import { ImageOptions } from "../../interfaces/ImageProcessing";
import { appendField, appendFields, appendFile } from "../../core/multipart";

/** The cover image plus its processing options (its file id is `Event.coverImageId`). */
export interface EventCoverUpload {
  file: Blob | File;
  /** Image-processing config (must include `mode`) — see {@link ImageOptions}. */
  options: ImageOptions;
}

/** A gallery image set plus shared processing options (Files with eventId + position). */
export interface EventGalleryUpload {
  files: (Blob | File)[];
  /** Image-processing config applied to every gallery image — see {@link ImageOptions}. */
  options: ImageOptions;
}

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
  /** Additional host user IDs (the logged-in user is auto-added as a host). */
  hostIds?: string[];
  metadata?: Record<string, any>;
  /**
   * The cover image (one image). When present the request is sent as
   * `multipart/form-data`. Its file is returned in the event's `files`, and
   * `coverImageId` points at it. Requires the `files-images` bundle.
   */
  coverFile?: EventCoverUpload;
  /**
   * Inline gallery images (multi). When present the request is sent as
   * `multipart/form-data`. Requires the `files-images` bundle.
   */
  gallery?: EventGalleryUpload;
}

export async function createEvent(
  client: SublayHttpClient,
  data: CreateEventProps
): Promise<Event> {
  const { coverFile, gallery, ...body } = data;

  const hasCover = !!coverFile;
  const hasGallery = !!gallery && gallery.files.length > 0;

  if (hasCover || hasGallery) {
    const formData = new FormData();

    // Files go under `coverFile`/`gallery`; their options ride alongside as
    // `coverFile.options` / `gallery.options` JSON strings (the createEvent
    // schema parses them). Object fields (location/hostIds/metadata) and
    // booleans are stringified by appendFields; the server coerces them back.
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

    const response = await client.projectInstance.post<Event>(
      "/events",
      formData
    );
    return response.data;
  }

  const response = await client.projectInstance.post<Event>("/events", body);
  return response.data;
}
