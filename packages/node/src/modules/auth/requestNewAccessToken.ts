import { SublayHttpClient } from "../../core/client";
import { AuthUser } from "../../interfaces/User";

export interface RequestNewAccessTokenProps {
  refreshToken: string;
}

/**
 * A new session: a fresh access token, the rotated refresh token (store it in
 * place of the one sent) and the signed-in user. An empty `refreshToken`
 * resolves to `{ user: null, accessToken: null }` instead.
 */
export type RequestNewAccessTokenResponse =
  | {
      success: true;
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }
  | {
      user: null;
      accessToken: null;
    };

export async function requestNewAccessToken(
  client: SublayHttpClient,
  data: RequestNewAccessTokenProps
): Promise<RequestNewAccessTokenResponse> {
  const response =
    await client.projectInstance.post<RequestNewAccessTokenResponse>(
      "/auth/request-new-access-token",
      data
    );
  return response.data;
}
