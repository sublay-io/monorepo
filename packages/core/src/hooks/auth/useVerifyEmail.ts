import { useCallback } from "react";
import axios from "../../config/axios";
import useProject from "../projects/useProject";
import { useSublayDispatch } from "../../store/hooks";
import { updateUserOptimistic } from "../../store/slices/userSlice";
import { SublayError } from "../../errors/SublayError";

export interface VerifyEmailProps {
  /** The link token or the emailed 6-digit code. */
  token: string;
  /**
   * The `verificationId` returned with a code (by sign-up, or by a sign-in
   * refused with `auth/email-not-verified`). Required to confirm such a code.
   * The account being confirmed is not signed in, so the signed-in user (if
   * any) is left untouched.
   */
  verificationId?: string;
}

function useVerifyEmail(): (props: VerifyEmailProps) => Promise<void> {
  const { projectId } = useProject();
  const dispatch = useSublayDispatch();

  const verifyEmail = useCallback(
    async ({ token, verificationId }: VerifyEmailProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!token?.trim()) {
        throw new SublayError("Verification token is required.");
      }

      await axios.post(`/${projectId}/auth/verify-email`, {
        token: token.trim(),
        ...(verificationId ? { verificationId } : {}),
      });

      // A code confirmed with a `verificationId` belongs to an account that
      // isn't signed in (sign-up, or a refused sign-in), so the signed-in user
      // is not the one being confirmed. Otherwise update local state
      // immediately so the UI reflects the verified status.
      if (!verificationId) {
        dispatch(updateUserOptimistic({ isVerified: true }));
      }
    },
    [projectId, dispatch]
  );

  return verifyEmail;
}

export default useVerifyEmail;
