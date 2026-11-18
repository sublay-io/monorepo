import { SublayHttpClient } from "../../core/client";

export interface SetPasswordProps {
  newPassword: string;
}

export async function setPassword(
  client: SublayHttpClient,
  data: SetPasswordProps
): Promise<void> {
  await client.projectInstance.post<void>(
    "/auth/set-password",
    data
  );
}
