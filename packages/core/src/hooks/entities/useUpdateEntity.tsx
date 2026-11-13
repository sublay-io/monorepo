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
      setEntity?.(updatedEntity);

      // Loaded entity lists show the edit too. Merged over each list's copy,
      // so what the update response doesn't carry (`saved`, `space`, `files`,
      // `topComments`, ...) stays. Two fields it does carry are left out: its
      // `userReaction` is always null (the response isn't read as the
      // viewer), and its `user` has no avatar or banner files.
      const { userReaction: _userReaction, user: _user, ...changes } =
        updatedEntity;
      dispatch(updateEntityInLists({ entityId, changes }));
      return updatedEntity;
    },
    [projectId, axios, setEntity, dispatch],
  );

  return updateEntity;
}

export default useUpdateEntity;
