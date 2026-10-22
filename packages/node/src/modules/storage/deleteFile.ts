import { SublayHttpClient } from "../../core/client";

export interface DeleteFileProps {
  fileId: string;
  /**
   * The user this delete acts as (service key only). Required when the file
   * has an owner: name the owner, and the delete runs exactly as their own
   * access token's. Omit it only for an app-owned file (no owner).
   */
  actingUserId?: string;
}

export async function deleteFile(
  client: SublayHttpClient,
  data: DeleteFileProps
): Promise<void> {
  const { fileId, actingUserId } = data;
  await client.projectInstance.delete(`/storage/${fileId}`, {
    params: { actingUserId },
  });
}
