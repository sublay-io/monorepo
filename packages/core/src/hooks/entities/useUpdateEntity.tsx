import { useCallback, useRef } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Entity } from "../../interfaces/models/Entity";
import { Mention } from "../../interfaces/models/Mention";
import useEntity from "./useEntity";
import { useSublayDispatch } from "../../store/hooks";
import { updateEntityInLists } from "../../store/slices/entityListsSlice";

export interface UpdateEntityProps {
  entityId: string;
  update: {
    title?: string | null | undefined;
    content?: string | null | undefined;
    attachments?: Record<string, any>[];
    keywords?: string[];
    location?: {
      latitude: number;
      longitude: number;
    };
    metadata?: Record<string, any>;
    mentions?: Mention[];
    nsfw?: boolean;
  };
}

/**
 * The fields of an entity-update response that are applied over a copy of the
 * entity already held (an `EntityProvider`'s, a loaded list's). Fields the
 * response doesn't carry (`saved`, `space`, `files`, `topComments`, ...) stay
 * as the copy has them. Two fields it does carry are left out: its
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
      const {
        title,
        content,
        attachments,
        keywords,
        location,
        metadata,
        mentions,
        nsfw,
      } = update;

      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const response = await axios.patch(
        `/${projectId}/entities/${entityId}`,
        {
          title,
          content,
          attachments,
          keywords,
          location,
          metadata,
          mentions,
          nsfw,
        },
      );

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
