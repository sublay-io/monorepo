import { SublayHttpClient } from "../../core/client";
import { UserFull } from "../../interfaces/User";

export interface UpdateUserProps {
  userId: string;
  /**
   * The user this request acts as. Must be the same user as `userId`: a
   * service key updates a user by acting as that user, and the request then
   * behaves exactly as that user's own access token would.
   */
  actingUserId: string;
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  metadata?: Record<string, any>;
  secureMetadata?: Record<string, any>;
  birthdate?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export async function updateUser(
  client: SublayHttpClient,
  data: UpdateUserProps
): Promise<UserFull> {
  const { userId, ...body } = data;
  const response = await client.projectInstance.patch<UserFull>(
    `/users/${userId}`,
    body
  );
  return response.data;
}
