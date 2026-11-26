import { useCallback } from "react";
import axios from "../../config/axios";
import useProject from "../projects/useProject";
import { SublayError } from "../../errors/SublayError";

export interface RequestPasswordResetProps {
  email: string;
}

function useRequestPasswordReset(): (props: RequestPasswordResetProps) => Promise<void> {
  const { projectId } = useProject();

  const requestPasswordReset = useCallback(
    async ({ email }: RequestPasswordResetProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!email?.trim()) {
        throw new SublayError("Email is required.");
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
