import { SublayHttpClient } from "../../core/client";
import { Event, EventType, EventVisibility } from "../../interfaces/Event";
import { ImageOptions } from "../../interfaces/ImageProcessing";
import {
  appendField,
  appendFields,
  appendFile,
  appendListUploads,
  hasListUploads,
  type FileListUpload,
  type ImageListUpload,
} from "../../core/multipart";

/** The cover image plus its processing options (its file id is `Event.coverImageId`). */
export interface EventCoverUpload {
  file: Blob | File;
  /** Image-processing config (must include `mode`) — see {@link ImageOptions}. */
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
   * Images in the event's files, processed into sizes per `options` (`mode`
   * is required). When present the request is sent as `multipart/form-data`.
   * Requires the `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files in the event's files, stored as uploaded. When present the request
   * is sent as `multipart/form-data`. Requires the `files-images` bundle.
   */
  files?: FileListUpload;
}

export async function createEvent(
  client: SublayHttpClient,
  data: CreateEventProps
): Promise<Event> {
  const { coverFile, images, files, ...body } = data;

  const hasCover = !!coverFile;

  if (hasCover || hasListUploads({ images, files })) {
    const formData = new FormData();

    // Files go under `coverFile` / `images` / `files`; their options ride
    // alongside as `coverFile.options` / `images.options` / `files.options`
    // JSON strings (the createEvent schema parses them). Object fields (location/hostIds/metadata) and
    // booleans are stringified by appendFields; the server coerces them back.
    if (coverFile) {
      appendFile(formData, "coverFile", coverFile.file, { fallback: "cover" });
      appendField(formData, "coverFile.options", coverFile.options);
    }
    appendListUploads(formData, { images, files });

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
