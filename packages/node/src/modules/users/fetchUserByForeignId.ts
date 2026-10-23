import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { User, UserIncludeParam } from "../../interfaces/User";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchUserByForeignIdProps extends SpaceReputationUserParams {
  foreignId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get, so a profile whose owner blocked them comes
   * back as not found. Omit it for the anonymous view. With
   * `createIfNotFound`, it shapes only the read; a user created by this call
   * is always created by the app.
   */
  actingUserId?: string;
  createIfNotFound?: boolean;
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  metadata?: Record<string, any>;
  secureMetadata?: Record<string, any>;
  include?: UserIncludeParam;
}

export async function fetchUserByForeignId(
  client: SublayHttpClient,
  data: FetchUserByForeignIdProps
): Promise<User> {
  const path = `/users/by-foreign-id`;

  const params: Record<string, any> = {
    foreignId: data.foreignId,
    actingUserId: data.actingUserId,
    createIfNotFound: data.createIfNotFound,
    name: data.name,
    username: data.username,
    avatar: data.avatar,
    bio: data.bio,
    metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    secureMetadata: data.secureMetadata
      ? JSON.stringify(data.secureMetadata)
      : undefined,
    include: serializeInclude(data.include),
    ...buildSpaceReputationParams({
      spaceReputation: data.spaceReputation,
      spaceReputationId: data.spaceReputationId,
      spaceReputationDescendants: data.spaceReputationDescendants,
    }),
  };

  const response = await client.projectInstance.get<User>(path, {
    params,
  });

  return response.data;
}
