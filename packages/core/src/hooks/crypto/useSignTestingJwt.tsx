import axios from "../../config/axios";
import { handleError } from "../../utils/handleError";

const WARNING = `
    WARNING: You are using a testing function to generate JWTs in your client application.
    This is NOT secure and should ONLY be used for initial development and testing purposes.

    In production:
    - NEVER expose your secret key in client-side code.
    - Refer to the documentation at https://docs.sublay.io to implement JWT signing on your backend.
    - Rotate your secret key periodically, especially after moving from testing to production.

    Failure to follow these practices can lead to security vulnerabilities.
  `;

export interface SignTestingJwtProps {
  projectId: string;
  privateKey: string;
  userData: { id: string } & Record<string, any>;
}

function useSignTestingJwt(): (props: SignTestingJwtProps) => Promise<string | undefined> {
  const signTestingJwt = async ({
    projectId,
    privateKey,
    userData,
  }: SignTestingJwtProps) => {
    try {
      if (!projectId) {
        throw new Error("No project specified");
      }

      // Warn developers about the security risks
      console.warn(WARNING);
      // The project is the one in the path; the token's `iss` is set from it.
      const response = await axios.post(
        `/${projectId}/crypto/sign-testing-jwt/v2`,
        {
          privateKey,
          userData,
        },
      );

      return response.data as string;
    } catch (err: unknown) {
      handleError(err, "Failed to sign testing jwt: ");
    }
  };

  return signTestingJwt;
}

export default useSignTestingJwt;
