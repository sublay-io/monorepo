import { SublayHttpClient } from "../../core/client";
import { File } from "../../interfaces/File";

export interface RefreshFileLinksProps {
  /** The files to get fresh links for: up to 100 ids. */
  fileIds: string[];
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
