import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Event, EventType, EventVisibility } from "../../interfaces/models/Event";
import { toIsoString } from "../../utils/dates";
import {
  appendFileList,
  appendImageList,
  appendImageSlot,
  hasListFiles,
  type FileListUpload,
  type ImageListUpload,
  type ImageSlotUpload,
} from "../../utils/uploads";
import { SublayError } from "../../errors/SublayError";

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
  /**
   * Images in the event's files, processed into sizes per `options` (`mode`
   * is required). Requires the files-images bundle.
   */
  images?: ImageListUpload;
  /** Files in the event's files, stored as uploaded. Requires the files-images bundle. */
  files?: FileListUpload;
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
        images,
        files,
      } = props;

      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      const hasCover = !!coverFile && !!coverFile.file;
      const hasImages = hasListFiles(images);
      const hasFiles = hasListFiles(files);

      if (hasCover || hasImages || hasFiles) {
        // Multipart path. Field names mirror the server route: `coverFile` +
        // `coverFile.options`, `images` + `images.options`, `files` +
        // `files.options`.
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

        if (hasImages) appendImageList(formData, images!);
        if (hasFiles) appendFileList(formData, files!);

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
