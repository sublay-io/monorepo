import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Event, EventType, EventVisibility } from "../../interfaces/models/Event";
import { GalleryUploadConfig, isBrowserFile } from "./useCreateEvent";
import { toIsoString } from "../../utils/dates";
import { appendImageSlot, type ImageSlotUpload } from "../../utils/uploads";

export interface UpdateEventProps {
  eventId: string;
  update: {
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
     * cover (`coverImageId`; removing it clears the cover). Each must be one
     * of this event's files, or the whole update is refused. Works alone or
     * with `gallery` (append) and `coverFile` (replace).
     */
    removeFileIds?: string[];
    /** New cover image (one image) — REPLACES the existing cover. Sends multipart. */
    coverFile?: ImageSlotUpload;
    /** Gallery images (multi) — APPENDED to the event's images. Sends multipart. */
    gallery?: GalleryUploadConfig;
  };
}

/**
 * Edits an event. Hosts only (403 `event/forbidden`), and on an event in a
 * space only while they are active members of it and not banned in it or a
 * space above it (403 `event/not-space-member`). The space's admins and
 * moderators can't edit events they don't host.
 */
function useUpdateEvent(): (props: UpdateEventProps) => Promise<Event> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const updateEvent = useCallback(
    async ({ eventId, update }: UpdateEventProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      // The files go as multipart parts; everything else in `update` is a field.
      const { coverFile, gallery, ...fields } = update;

      const hasCover = !!coverFile && !!coverFile.file;
      const hasGallery = !!gallery && gallery.files.length > 0;

      if (hasCover || hasGallery) {
        // Multipart path — inline cover/gallery upload. Field names mirror the
        // server PATCH route: `coverFile` + `coverFile.options`, `gallery` +
        // `gallery.options`.
        const formData = new FormData();

        const u = fields;
        if (u.title !== undefined) formData.append("title", u.title);
        if (u.description !== undefined) formData.append("description", u.description);
        if (u.startTime !== undefined) formData.append("startTime", toIsoString(u.startTime));
        if (u.endTime !== undefined) formData.append("endTime", toIsoString(u.endTime));
        if (u.timezone !== undefined) formData.append("timezone", u.timezone);
        if (u.type !== undefined) formData.append("type", u.type);
        if (u.url !== undefined) formData.append("url", u.url);
        if (u.venueName !== undefined) formData.append("venueName", u.venueName);
        if (u.address !== undefined) formData.append("address", u.address);
        if (u.location !== undefined) formData.append("location", JSON.stringify(u.location));
        if (u.visibility !== undefined) formData.append("visibility", u.visibility);
        if (u.capacity !== undefined) formData.append("capacity", u.capacity.toString());
        if (u.allowMaybe !== undefined) formData.append("allowMaybe", u.allowMaybe.toString());
        if (u.guestListVisible !== undefined)
          formData.append("guestListVisible", u.guestListVisible.toString());
        if (u.metadata !== undefined) formData.append("metadata", JSON.stringify(u.metadata));
        if (u.removeFileIds !== undefined)
          formData.append("removeFileIds", JSON.stringify(u.removeFileIds));

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

        const response = await axios.patch<Event>(
          `/${projectId}/events/${eventId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data as Event;
      }

      const response = await axios.patch(`/${projectId}/events/${eventId}`, {
        ...fields,
        startTime:
          fields.startTime === undefined ? undefined : toIsoString(fields.startTime),
        endTime: fields.endTime === undefined ? undefined : toIsoString(fields.endTime),
      });

      return response.data as Event;
    },
    [projectId, axios]
  );

  return updateEvent;
}

export default useUpdateEvent;
