import { useCallback, useMemo } from "react";
import useProject from "../projects/useProject";
import { useUser } from "../user";
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "../../store/api/notificationPreferencesApi";
import { handleError } from "../../utils/handleError";
import type { PushEventType } from "../../interfaces/PushEventType";
import { SublayError, toSublayError, rethrowAsSublayError } from "../../errors/SublayError";

export interface UseNotificationPreferencesValues {
  /**
   * The set of push event types the user has opted OUT of. Empty (all-on) when
   * no preference row exists. `undefined` until the read resolves.
   */
  disabledTypes: PushEventType[] | undefined;
  loading: boolean;
  updating: boolean;
  error: SublayError | null;
  refetch: () => void;
  /**
   * Replace the user's disabled-types set (upsert). Server-exact type names.
   */
  updatePreferences: (props: { disabledTypes: PushEventType[] }) => Promise<void>;
}

/**
 * Read + update the acting user's push notification preferences (per-type
 * disable toggles). Mirrors the server's
 * `GET/PUT /:projectId/push-notifications/preferences` exactly.
 */
function useNotificationPreferences(): UseNotificationPreferencesValues {
  const { projectId } = useProject();
  const { user } = useUser();

  const skip = !projectId || !user;

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useGetNotificationPreferencesQuery(
    { projectId: projectId as string },
    { skip }
  );

  const [updateMutation, { isLoading: updating }] =
    useUpdateNotificationPreferencesMutation();

  const updatePreferences = useCallback(
    async ({ disabledTypes }: { disabledTypes: PushEventType[] }): Promise<void> => {
      if (!projectId || !user) {
        throw new SublayError("No project ID or authenticated user available");
      }

      try {
        await updateMutation({ projectId, disabledTypes }).unwrap().catch(rethrowAsSublayError);
      } catch (err) {
        handleError(err, "Failed to update notification preferences");
        throw err;
      }
    },
    [projectId, user, updateMutation]
  );

  const sublayError = useMemo(
    () => (error ? toSublayError(error) : null),
    [error]
  );

  return {
    disabledTypes: data?.disabledTypes,
    loading,
    updating,
    error: sublayError,
    refetch,
    updatePreferences,
  };
}

export default useNotificationPreferences;
