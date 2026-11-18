import { useCallback } from "react";
import axios from "../../config/axios";
import useProject from "../projects/useProject";

export interface RequestPasswordResetProps {
  email: string;
}

function useRequestPasswordReset(): (props: RequestPasswordResetProps) => Promise<void> {
  const { projectId } = useProject();

  const requestPasswordReset = useCallback(
    async ({ email }: RequestPasswordResetProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!email?.trim()) {
        throw new Error("Email is required.");
      }

      await axios.post(
        `/${projectId}/auth/request-password-reset`,
        { email: email.trim() }
      );
    },
    [projectId]
  );

  return requestPasswordReset;
}

export default useRequestPasswordReset;
