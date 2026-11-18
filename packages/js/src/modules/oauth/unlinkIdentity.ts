import { SublayHttpClient } from "../../core/client";

export interface UnlinkIdentityProps {
  identityId: string;
}

/**
 * Unlink one of the current user's OAuth identities (authenticated). The server
 * refuses to remove the last identity if the user has no password set.
 */
export async function unlinkIdentity(
  client: SublayHttpClient,
  data: UnlinkIdentityProps
): Promise<void> {
  const { identityId } = data;
  await client.projectInstance.delete<void>(
    `/oauth/identities/${identityId}`
  );
}
