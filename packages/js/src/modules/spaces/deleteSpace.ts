import { SublayHttpClient } from "../../core/client";

export interface DeleteSpaceProps {
  spaceId: string;
}

export async function deleteSpace(
  client: SublayHttpClient,
  data: DeleteSpaceProps
): Promise<void> {
  const { spaceId } = data;
  await client.projectInstance.delete<void>(
    `/spaces/${spaceId}`
  );
}
