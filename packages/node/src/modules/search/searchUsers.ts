import { SublayHttpClient } from "../../core/client";
import { User } from "../../interfaces/User";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface SearchUsersProps {
  query: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get, with their block rules applied. Omit it for
   * the anonymous view.
   */
  actingUserId?: string;
  limit?: number;
}

export async function searchUsers(
  client: SublayHttpClient,
  data: SearchUsersProps
): Promise<PaginatedResponse<User>> {
  const response = await client.projectInstance.post<PaginatedResponse<User>>(
    "/search/users",
    data
  );
  return response.data;
}
