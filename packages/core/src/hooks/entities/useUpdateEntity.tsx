import { useCallback, useRef } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Entity } from "../../interfaces/models/Entity";
import { Mention } from "../../interfaces/models/Mention";
import useEntity from "./useEntity";
import { useSublayDispatch } from "../../store/hooks";
import { updateEntityInLists } from "../../store/slices/entityListsSlice";
import {
  appendFileList,
  appendImageList,
  hasListFiles,
  type FileListUpload,
  type ImageListUpload,
} from "../../utils/uploads";

export interface UpdateEntityProps {
  entityId: string;
  update: {
    title?: string;
    content?: string;
    attachments?: Record<string, any>[];
    keywords?: string[];
    location?: {
      latitude: number;
      longitude: number;
    };
    metadata?: Record<string, any>;
    mentions?: Mention[];
    nsfw?: boolean;
    /**
     * Ids of the entity's files to remove (ids in its `files`). Each must be
     * one of this entity's files, or the whole update is refused. Works alone
     * or with `images` / `files`.
     */
    removeFileIds?: string[];
    /**
     * Images APPENDED to the entity's files, processed into sizes per
     * `options` (`mode` is required). Sends multipart.
     */
    images?: ImageListUpload;
    /** Files APPENDED to the entity's files, stored as uploaded. Sends multipart. */
    files?: FileListUpload;
  };
}

/**
 * The fields of an entity-update response that are applied over a copy of the
 * entity already held (an `EntityProvider`'s, a loaded list's). Fields the
 * response doesn't carry (`saved`, `space`, `topComments`, ...) stay as the
 * copy has them; `files` comes back (and replaces the copy's) only when the
 * update uploaded or removed files. Two fields it does carry are left out: its
 * `userReaction` is always null (the response isn't read as the viewer), and
 * its `user` has no avatar or banner files.
 */
export function entityUpdateChanges(updated: Entity): Partial<Entity> {
  const { userReaction: _userReaction, user: _user, ...changes } = updated;
  return changes;
}

/**
 * `updated` applied over `current` when it is the same entity. Anything else
 * is kept as it is: an edit of B made inside A's `EntityProvider` doesn't
 * replace A, and a provider with no entity yet (loading, or not found) doesn't
 * take on another entity's edit.
 */
export function applyEntityUpdate<T extends Entity | null | undefined>(
  current: T,
  updated: Entity,
): T | Entity {
  if (!current || current.id !== updated.id) return current;
  return { ...current, ...entityUpdateChanges(updated) };
}

function useUpdateEntity(): (props: UpdateEntityProps) => Promise<Entity> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { setEntity } = useEntity();
  const dispatch = useSublayDispatch();

  const updateEntity = useCallback(
    async (props: UpdateEntityProps) => {
      const { entityId, update } = props;
      // The files go as multipart parts; everything else in `update` is a field.
      const { images, files, ...fields } = update;

      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const hasImages = hasListFiles(images);
      const hasFiles = hasListFiles(files);
      const path = `/${projectId}/entities/${entityId}`;

      let response;
      if (hasImages || hasFiles) {
        // Multipart: object fields as JSON strings (the server parses them
        // back), `removeFileIds` included.
        const formData = new FormData();
        const u = fields;
        if (u.title !== undefined) formData.append("title", u.title);
        if (u.content !== undefined) formData.append("content", u.content);
        if (u.attachments !== undefined)
          formData.append("attachments", JSON.stringify(u.attachments));
        if (u.keywords !== undefined) formData.append("keywords", JSON.stringify(u.keywords));
        if (u.location !== undefined) formData.append("location", JSON.stringify(u.location));
        if (u.metadata !== undefined) formData.append("metadata", JSON.stringify(u.metadata));
        if (u.mentions !== undefined) formData.append("mentions", JSON.stringify(u.mentions));
        if (u.nsfw !== undefined) formData.append("nsfw", u.nsfw.toString());
        if (u.removeFileIds !== undefined)
          formData.append("removeFileIds", JSON.stringify(u.removeFileIds));

        if (hasImages) appendImageList(formData, images!);
        if (hasFiles) appendFileList(formData, files!);

        response = await axios.patch(path, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const {
          title,
          content,
          attachments,
          keywords,
          location,
          metadata,
          mentions,
          nsfw,
          removeFileIds,
        } = fields;
        response = await axios.patch(path, {
          title,
          content,
          attachments,
          keywords,
          location,
          metadata,
          mentions,
          nsfw,
          removeFileIds,
        });
      }

      const updatedEntity = response.data as Entity;
      // The nearest `EntityProvider` and every loaded entity list show the
      // edit, applied over their copy (see `entityUpdateChanges`).
      setEntity?.((current) => applyEntityUpdate(current, updatedEntity));
      dispatch(
        updateEntityInLists({
          entityId,
          changes: entityUpdateChanges(updatedEntity),
        })
      );
      return updatedEntity;
    },
    [projectId, axios, setEntity, dispatch],
  );

  return updateEntity;
}

export default useUpdateEntity;
