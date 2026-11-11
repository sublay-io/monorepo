import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Event, EventType, EventVisibility } from "../../interfaces/models/Event";
import {
  CoverUploadConfig,
  GalleryUploadConfig,
  isBrowserFile,
} from "./useCreateEvent";

export interface UpdateEventProps {
  eventId: string;
  update: {
    title?: string;
    description?: string;
    startTime?: string; // ISO datetime
    endTime?: string; // ISO datetime
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
     * File IDs of existing event images to REMOVE (gallery photos and/or the
     * current cover). Combine with `gallery` (append) + `cover` (replace) to
     * fully curate the image set in one update.
     */
    removeImageIds?: string[];
  };
  /** New cover image (single) — REPLACES the existing cover. Sends multipart. */
  cover?: CoverUploadConfig;
  /** Gallery images (multi) — APPENDED to the event. Sends multipart. */
  gallery?: GalleryUploadConfig;
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
    async ({ eventId, update, cover, gallery }: UpdateEventProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const hasCover = !!cover && !!cover.file;
      const hasGallery = !!gallery && gallery.files.length > 0;

      if (hasCover || hasGallery) {
        // Multipart path — inline cover/gallery upload. Field names mirror the
        // server PATCH route's `upload.fields([{ cover }, { gallery }])`.
        const formData = new FormData();

        const u = update;
        if (u.title !== undefined) formData.append("title", u.title);
        if (u.description !== undefined) formData.append("description", u.description);
        if (u.startTime !== undefined) formData.append("startTime", u.startTime);
        if (u.endTime !== undefined) formData.append("endTime", u.endTime);
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
        if (u.removeImageIds !== undefined)
          formData.append("removeImageIds", JSON.stringify(u.removeImageIds));

        if (hasCover) {
          const file = cover!.file;
          if (isBrowserFile(file)) {
            formData.append("cover", file, file.name);
          } else {
            formData.append("cover", {
              uri: file.uri,
              type: file.type || "image/jpeg",
              name: file.name,
            } as any);
          }
          if (cover!.options) {
            formData.append("cover.options", JSON.stringify(cover!.options));
          }
        }

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

      const response = await axios.patch(
        `/${projectId}/events/${eventId}`,
        update
      );

      return response.data as Event;
    },
    [projectId, axios]
  );

  return updateEvent;
}

export default useUpdateEvent;
