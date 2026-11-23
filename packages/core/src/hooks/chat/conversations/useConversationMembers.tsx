import { useCallback, useEffect, useState } from "react";
import {
  ConversationMember,
  ConversationMemberRole,
} from "../../../interfaces/models/ConversationMember";
import type { SocketConversationMember } from "../../../types/socket";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { handleError } from "../../../utils/handleError";
import { SpaceReputationContextParams } from "../../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../../utils/spaceReputationParams";

export interface UseConversationMembersProps extends SpaceReputationContextParams {
  conversationId: string;
}

/**
 * `incoming` merged into the listed copy of the same member, or appended.
 * The add, role-change and `member:joined` rows carry no `user`, so a merge
 * keeps the one the list loaded.
 */
function mergeMember(
  prev: ConversationMember[],
  incoming: ConversationMember | SocketConversationMember
): ConversationMember[] {
  const idx = prev.findIndex((m) => m.userId === incoming.userId);
  if (idx === -1) return [...prev, incoming];
  const next = [...prev];
  next[idx] = { ...prev[idx], ...incoming };
  return next;
}

export interface UseConversationMembersValues {
  members: ConversationMember[];
  loading: boolean;
  /** Adds the user and resolves to their member row (without `user`). */
  addMember: ({ userId }: { userId: string }) => Promise<ConversationMember>;
  removeMember: ({ userId }: { userId: string }) => Promise<void>;
  leave: () => Promise<void>;
  /** Changes the member's role and resolves to their member row (without `user`). */
  changeRole: ({
    userId,
    role,
  }: {
    userId: string;
    role: ConversationMemberRole;
  }) => Promise<ConversationMember>;
  /**
   * Upsert a member into the local list (for real-time socket updates). A
   * member already listed keeps its loaded `user`.
   */
  upsertMember: (member: ConversationMember | SocketConversationMember) => void;
  /** Remove a member from the local list by userId (for real-time socket updates). */
  removeMemberLocally: ({ userId }: { userId: string }) => void;
}

function useConversationMembers({
  conversationId,
  spaceReputation,
}: UseConversationMembersProps): UseConversationMembersValues {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const reputationParams = buildSpaceReputationParams({ spaceReputation });
  const reputationKey = JSON.stringify(reputationParams);

  const [members, setMembers] = useState<ConversationMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !conversationId) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = { limit: 100, ...reputationParams };
        const response = await axios.get(
          `/${projectId}/chat/conversations/${conversationId}/members`,
          { params }
        );
        setMembers(response.data.data as ConversationMember[]);
      } catch (err) {
        handleError(err, "Failed to load conversation members");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [projectId, conversationId, reputationKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const addMember = useCallback(
    async ({ userId }: { userId: string }): Promise<ConversationMember> => {
      if (!projectId) throw new Error("No projectId available.");
      if (!conversationId) throw new Error("No conversationId provided.");
      try {
        const response = await axios.post(
          `/${projectId}/chat/conversations/${conversationId}/members`,
          { userId }
        );
        const newMember = response.data as ConversationMember;
        setMembers((prev) => mergeMember(prev, newMember));
        return newMember;
      } catch (err) {
        handleError(err, "Failed to add member");
        throw err;
      }
    },
    [projectId, conversationId, axios]
  );

  const removeMember = useCallback(
    async ({ userId }: { userId: string }) => {
      if (!projectId || !conversationId) return;
      try {
        await axios.delete(
          `/${projectId}/chat/conversations/${conversationId}/members/${userId}`
        );
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
      } catch (err) {
        handleError(err, "Failed to remove member");
        throw err;
      }
    },
    [projectId, conversationId, axios]
  );

  const leave = useCallback(async () => {
    if (!projectId || !conversationId) return;
    try {
      await axios.delete(
        `/${projectId}/chat/conversations/${conversationId}/members/me`
      );
    } catch (err) {
      handleError(err, "Failed to leave conversation");
      throw err;
    }
  }, [projectId, conversationId, axios]);

  const upsertMember = useCallback(
    (member: ConversationMember | SocketConversationMember) => {
      setMembers((prev) => mergeMember(prev, member));
    },
    []
  );

  const removeMemberLocally = useCallback(({ userId }: { userId: string }) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  }, []);

  const changeRole = useCallback(
    async ({
      userId,
      role,
    }: {
      userId: string;
      role: ConversationMemberRole;
    }): Promise<ConversationMember> => {
      if (!projectId) throw new Error("No projectId available.");
      if (!conversationId) throw new Error("No conversationId provided.");
      try {
        const response = await axios.patch(
          `/${projectId}/chat/conversations/${conversationId}/members/${userId}/role`,
          { role }
        );
        const updated = response.data as ConversationMember;
        setMembers((prev) =>
          prev.some((m) => m.userId === userId) ? mergeMember(prev, updated) : prev
        );
        return updated;
      } catch (err) {
        handleError(err, "Failed to change member role");
        throw err;
      }
    },
    [projectId, conversationId, axios]
  );

  return { members, loading, addMember, removeMember, leave, changeRole, upsertMember, removeMemberLocally };
}

export default useConversationMembers;
