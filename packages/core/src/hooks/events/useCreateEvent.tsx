import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Event, EventType, EventVisibility } from "../../interfaces/models/Event";
import { UploadImageOptions } from "../../interfaces/models/Image";
import { toIsoString } from "../../utils/dates";
import { appendImageSlot, type ImageSlotUpload } from "../../utils/uploads";

// Universal file typing (mirrors useCreateEntity).
type BrowserFile = File;

interface RNFile {
  uri: string;
  name: string;
  type?: string;
}

export type UniversalFile = BrowserFile | RNFile;

export function isBrowserFile(file: UniversalFile): file is BrowserFile {
  return typeof File !== "undefined" && file instanceof File;
}

// Multi-image gallery slot (Files with eventId + position). Shared with useUpdateEvent.
export interface GalleryUploadConfig {
  files: UniversalFile[];
  options?: UploadImageOptions;
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
   * The cover image (one image, processed per `options`; `mode` is required).
   * Its file is returned in the event's `files`, and `coverImageId` points at
   * it. Requires the files-images bundle.
   */
  coverFile?: ImageSlotUpload;
  /** Inline gallery image upload (multi). Requires the files-images bundle. */
  gallery?: GalleryUploadConfig;
}

function useCreateEvent(): (props: CreateEventProps) => Promise<Event> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const createEvent = useCallback(
    async (props: CreateEventProps) => {
      const {
        title,
        description,
        startTime,
        endTime,
        timezone,
        type,
        url,
        venueName,
        address,
        location,
        spaceId,
        visibility,
        capacity,
        allowMaybe,
        guestListVisible,
        hostIds,
        metadata,
        coverFile,
        gallery,
      } = props;

      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const hasCover = !!coverFile && !!coverFile.file;
      const hasGallery = !!gallery && gallery.files.length > 0;

      if (hasCover || hasGallery) {
        // Multipart path — inline cover/gallery upload. Field names mirror the
        // server route: `coverFile` + `coverFile.options`, `gallery` +
        // `gallery.options`.
        const formData = new FormData();

        if (title !== undefined) formData.append("title", title);
        if (description !== undefined) formData.append("description", description);
        if (startTime !== undefined) formData.append("startTime", toIsoString(startTime));
        if (endTime !== undefined) formData.append("endTime", toIsoString(endTime));
        if (timezone !== undefined) formData.append("timezone", timezone);
        if (type !== undefined) formData.append("type", type);
        if (url !== undefined) formData.append("url", url);
        if (venueName !== undefined) formData.append("venueName", venueName);
        if (address !== undefined) formData.append("address", address);
        if (location !== undefined) formData.append("location", JSON.stringify(location));
        if (spaceId !== undefined) formData.append("spaceId", spaceId);
        if (visibility !== undefined) formData.append("visibility", visibility);
        if (capacity !== undefined) formData.append("capacity", capacity.toString());
        if (allowMaybe !== undefined) formData.append("allowMaybe", allowMaybe.toString());
        if (guestListVisible !== undefined)
          formData.append("guestListVisible", guestListVisible.toString());
        if (hostIds !== undefined) formData.append("hostIds", JSON.stringify(hostIds));
        if (metadata !== undefined) formData.append("metadata", JSON.stringify(metadata));

        if (hasCover) appendImageSlot(formData, "coverFile", coverFile!);

        if (hasGallery) {
          gallery!.files.forEach((file) => {
            if (isBrowserFile(file)) {
              formData.append("gallery", file, file.name);
            } else {
              formData.append("gallery", {
                uri: file.uri,
                type: file.type || "image/jpeg",
                name: file.name,
              } as any);
            }
          });
          if (gallery!.options) {
            formData.append("gallery.options", JSON.stringify(gallery!.options));
          }
        }

        const response = await axios.post<Event>(
          `/${projectId}/events`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        return response.data as Event;
      }

      // JSON path.
      const response = await axios.post<Event>(`/${projectId}/events`, {
        title,
        description,
        startTime: toIsoString(startTime),
        endTime: endTime === undefined ? undefined : toIsoString(endTime),
        timezone,
        type,
        url,
        venueName,
        address,
        location,
        spaceId,
        visibility,
        capacity,
        allowMaybe,
        guestListVisible,
        hostIds,
        metadata,
      });

      return response.data as Event;
    },
    [projectId, axios]
  );

  return createEvent;
}

export default useCreateEvent;
