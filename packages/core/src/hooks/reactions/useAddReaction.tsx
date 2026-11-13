import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { useSublayDispatch } from "../../store/hooks";
import { updateEntityInLists } from "../../store/slices/entityListsSlice";
import { Entity } from "../../interfaces/models/Entity";
import { Comment } from "../../interfaces/models/Comment";
import { ReactionType } from "../../interfaces/models/Reaction";

export interface AddReactionProps {
  targetType: "entity" | "comment";
  targetId: string;
  reactionType: ReactionType;
}

function useAddReaction(): (props: AddReactionProps) => Promise<Entity | Comment> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const dispatch = useSublayDispatch();

  const addReaction = useCallback(
    async (props: AddReactionProps): Promise<Entity | Comment> => {
      const { targetType, targetId, reactionType } = props;

      if (!targetId) {
        throw new Error("No target ID provided");
      }

      if (!reactionType) {
        throw new Error("No reaction type provided");
      }

      if (!projectId) {
        throw new Error("No project specified");
      }

      // Determine endpoint based on targetType
      const endpoint =
        targetType === "entity"
          ? `/${projectId}/entities/${targetId}/reactions`
          : `/${projectId}/comments/${targetId}/reactions`;

      const response = await axios.post(endpoint, { reactionType });

      // Loaded entity lists show the viewer's reaction and the counts too.
      if (targetType === "entity") {
        const entity = response.data as Entity;
        dispatch(
          updateEntityInLists({
            entityId: targetId,
            changes: {
              userReaction: entity.userReaction ?? null,
              ...(entity.reactionCounts
                ? { reactionCounts: entity.reactionCounts }
                : {}),
            },
          })
        );
      }

      return response.data as Entity | Comment;
    },
    [axios, projectId, dispatch]
  );

  return addReaction;
}

export default useAddReaction;
