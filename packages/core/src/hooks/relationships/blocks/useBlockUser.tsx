import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import type { BlockRow } from "../../../interfaces/models/Block";

export interface BlockUserProps {
  userId: string;
}

function useBlockUser(): (props: BlockUserProps) => Promise<BlockRow> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const blockUser = useCallback(
    async (props: BlockUserProps) => {
      const { userId } = props;
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!userId) {
        throw new Error("No user ID was provided");
      }

      // 201 for a new block, 200 when already blocking; `user` on the
      // returned row is the blocked user.
      const response = await axios.post<BlockRow>(
        `/${projectId}/users/${userId}/block`,
        {}
      );
      return response.data;
    },
    [axios, projectId]
  );

  return blockUser;
}

export default useBlockUser;
