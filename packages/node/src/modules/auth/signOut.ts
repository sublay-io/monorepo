import { SublayHttpClient } from "../../core/client";
import { PushDeviceIdentifier } from "../../interfaces/Push";

export interface SignOutProps {
  refreshToken: string;
  /**
   * Optional. When supplied — and the project has the `push` bundle — the
   * server deletes this user's push binding for that device in the SAME
   * transaction as the token-family destroy: signing out unbinds the device's
   * push, or nothing happens at all.
   *
   * If the unbind fails the request fails (HTTP 500, code
   * `auth/device-deregistration-failed`) and NOTHING is committed — the
   * session survives so the caller can retry. Do not treat a failed sign-out
   * as signed out.
   */
  pushDevice?: PushDeviceIdentifier;
}

/**
 * Signed out, but no push unbind was attempted because the server could not
 * tell whether the project has push devices: this device may still be bound
 * to the account.
 */
export interface SignOutPushUnbindSkipped {
  pushUnbindSkipped: true;
  code: "auth/push-unbind-status-unknown";
  message: string;
}

/**
 * Resolves to `null` when signed out (HTTP 204), or to
 * {@link SignOutPushUnbindSkipped} (HTTP 200) when signed out without the
 * requested push unbind.
 */
export async function signOut(
  client: SublayHttpClient,
  data: SignOutProps
): Promise<SignOutPushUnbindSkipped | null> {
  const response = await client.projectInstance.post<SignOutPushUnbindSkipped>(
    "/auth/sign-out",
    data
  );
  return response.status === 204 ? null : response.data;
}
