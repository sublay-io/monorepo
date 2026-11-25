import { SublayHttpClient } from "../../core/client";
import { File } from "../../interfaces/File";

export interface RefreshFileLinksProps {
  /** The files to get fresh links for: up to 100 ids. */
  fileIds: string[];
  /**
   * The user this read acts as (service key only): the answer holds the
   * files that user can see. Omit it to read as the app: then only files
   * attached to no record, and those anyone can see, come back.
   */
  actingUserId?: string;
}

export interface RefreshFileLinksResponse {
  /**
   * Fresh Files, with new links and `linksExpireAt`, in the order asked for.
   * A file that's missing, or that the viewer can no longer see, is left out.
   */
  files: File[];
}

/** `POST /files/links`: fresh links for files whose links expired. */
export async function refreshFileLinks(
  client: SublayHttpClient,
  data: RefreshFileLinksProps
): Promise<RefreshFileLinksResponse> {
  const response = await client.projectInstance.post<RefreshFileLinksResponse>(
    "/files/links",
    data
  );
  return response.data;
}
