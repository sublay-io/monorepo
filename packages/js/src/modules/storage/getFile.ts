import { SublayHttpClient } from "../../core/client";
import { File } from "../../interfaces/File";

export interface GetFileProps {
  fileId: string;
}

/**
 * `GET /storage/:fileId`: the File, the same shape the uploads return. A file
 * attached to a record comes back only to someone who can see that record;
 * otherwise 404, like a missing one.
 */
export async function getFile(
  client: SublayHttpClient,
  data: GetFileProps
): Promise<File> {
  const { fileId } = data;
  const response = await client.projectInstance.get<File>(
    `/storage/${fileId}`
  );
  return response.data;
}
