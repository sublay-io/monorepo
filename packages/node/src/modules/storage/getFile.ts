import { SublayHttpClient } from "../../core/client";
import { File } from "../../interfaces/File";

export interface GetFileProps {
  fileId: string;
  /**
   * The user this read acts as (service key only). A file attached to a
   * record comes back only to someone who can see that record; without it,
   * the key sees files attached to nothing, and those anyone can see.
   */
  actingUserId?: string;
}

/**
 * `GET /storage/:fileId`: the File, the same shape the uploads return. A file
 * the viewer can't see answers 404, like a missing one.
 */
export async function getFile(
  client: SublayHttpClient,
  data: GetFileProps
): Promise<File> {
  const { fileId, actingUserId } = data;
  const response = await client.projectInstance.get<File>(
    `/storage/${fileId}`,
    { params: { actingUserId } }
  );
  return response.data;
}
