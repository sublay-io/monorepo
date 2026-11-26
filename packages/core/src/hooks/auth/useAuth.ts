import { useCallback } from 'react';
import { useSublayDispatch, useSublaySelector } from '../../store/hooks';
import {
  selectAccessToken,
  selectRefreshToken,
  selectInitialized,
  setRefreshToken
} from '../../store/slices/authSlice';
import { 
  signUpWithEmailAndPasswordThunk,
  signInWithEmailAndPasswordThunk,
  signOutThunk,
  changePasswordThunk,
  setPasswordThunk,
  requestNewAccessTokenThunk
} from '../../store/slices/authThunks';
import useProject from '../projects/useProject';
import type { ImageSlotUpload } from '../../utils/uploads';
import type {
  AuthRejection,
  EmailVerificationOptions,
  EmailVerificationRequiredResult,
  SublayAuthError,
} from '../../interfaces/EmailVerification';
import { SublayError } from '../../errors/SublayError';

/**
 * Turns an auth thunk's rejection payload (an `AuthRejection`, or a plain
 * message for a failure the SDK found itself) into the `SublayError` the hook
 * throws, carrying the server's `code`, `status`, `param` and `body`, and the
 * `verificationId` when present.
 */
export function toAuthError(payload: unknown): SublayAuthError {
  const rejection = (
    payload && typeof payload === 'object' ? payload : { message: payload }
  ) as Partial<AuthRejection>;
  const error: SublayAuthError = new SublayError(
    typeof rejection.message === 'string' ? rejection.message : 'Unknown error',
    {
      code: rejection.code || undefined,
      param: rejection.param || undefined,
      status: typeof rejection.status === 'number' ? rejection.status : undefined,
      body: rejection.body,
    }
  );
  if (rejection.verificationId) error.verificationId = rejection.verificationId;
  return error;
}

export interface SignUpWithEmailAndPasswordProps {
  email: string;
  password: string;
  /** `null` is the same as leaving it out. */
  name?: string | null;
  username?: string;
  /** The avatar as an image URL; `null` is the same as leaving it out. */
  avatar?: string | null;
  /** `null` is the same as leaving it out. */
  bio?: string | null;
  location?: {
    latitude: number;
    longitude: number;
  };
  /**
   * A `Date`, or a full UTC timestamp string such as
   * `"1990-05-17T00:00:00.000Z"` (a date alone, like `"1990-05-17"`, is refused).
   */
  birthdate?: string | Date;
  metadata?: Record<string, any>;
  secureMetadata?: Record<string, any>;
  /** The user's avatar image: the file plus its processing options. */
  avatarFile?: ImageSlotUpload;
  /** The user's banner image: the file plus its processing options. */
  bannerFile?: ImageSlotUpload;
  /**
   * How the confirmation email is sent when the project requires email
   * verification before sign-in. Ignored when the setting is off.
   */
  emailVerification?: EmailVerificationOptions;
}

export interface SignInWithEmailAndPasswordProps {
  email: string;
  password: string;
  /**
   * How the confirmation email is sent when sign-in is refused because the
   * account's email isn't confirmed. Ignored when the project doesn't require
   * email verification before sign-in.
   */
  emailVerification?: EmailVerificationOptions;
}

export interface ChangePasswordProps {
  password: string;
  newPassword: string;
}

export interface SetPasswordProps {
  newPassword: string;
}

// Define the interface to match the original useAuth hook
export interface UseAuthValues {
  initialized: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setRefreshToken: React.Dispatch<React.SetStateAction<string | null>>;
  /**
   * Resolves `{ emailVerificationRequired: true, verificationId? }` when the
   * project requires email verification before sign-in (no session is
   * created); otherwise signs the new user in and resolves nothing. Throws an
   * `Error` carrying the server's `code`.
   */
  signUpWithEmailAndPassword: (
    props: SignUpWithEmailAndPasswordProps
  ) => Promise<EmailVerificationRequiredResult | void>;
  /**
   * Throws an `Error` carrying the server's `code` on failure — e.g.
   * `auth/email-not-verified`, with `verificationId` in code mode.
   */
  signInWithEmailAndPassword: (props: SignInWithEmailAndPasswordProps) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (props: ChangePasswordProps) => Promise<void>;
  setPassword: (props: SetPasswordProps) => Promise<void>;
  /**
   * Rotates the stored refresh token and resolves with the new access token.
   *
   * Always resolves a token or THROWS — including when no project is
   * configured, which every other action on this hook already treats as a
   * thrown error. It used to resolve `undefined` there while every genuine
   * failure threw, so the one value the type still advertised was
   * indistinguishable from a call that simply had nothing to do.
   */
  requestNewAccessToken: () => Promise<string>;
}

export default function useAuth(): UseAuthValues {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();

  // Selectors
  const initialized = useSublaySelector(selectInitialized);
  const accessToken = useSublaySelector(selectAccessToken);
  const refreshToken = useSublaySelector(selectRefreshToken);

  // Actions
  const handleSignUpWithEmailAndPassword = useCallback(
    async (props: SignUpWithEmailAndPasswordProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      const result = await dispatch(signUpWithEmailAndPasswordThunk({
        projectId,
        ...props,
      }));

      if (signUpWithEmailAndPasswordThunk.rejected.match(result)) {
        throw toAuthError(result.payload);
      }

      if (
        result.payload &&
        (result.payload as EmailVerificationRequiredResult)
          .emailVerificationRequired === true
      ) {
        return result.payload as EmailVerificationRequiredResult;
      }
    },
    [dispatch, projectId]
  );

  const handleSignInWithEmailAndPassword = useCallback(
    async (props: SignInWithEmailAndPasswordProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      const result = await dispatch(signInWithEmailAndPasswordThunk({
        projectId,
        ...props,
      }));
      
      if (signInWithEmailAndPasswordThunk.rejected.match(result)) {
        throw toAuthError(result.payload);
      }
    },
    [dispatch, projectId]
  );

  const handleSignOut = useCallback(async () => {
    if (!projectId) {
      throw new SublayError("No projectId available.");
    }

    const result = await dispatch(signOutThunk({ projectId }));
    
    if (signOutThunk.rejected.match(result)) {
      throw toAuthError(result.payload);
    }
  }, [dispatch, projectId]);

  const handleChangePassword = useCallback(
    async (props: ChangePasswordProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      const result = await dispatch(changePasswordThunk({
        projectId,
        ...props,
      }));
      
      if (changePasswordThunk.rejected.match(result)) {
        throw toAuthError(result.payload);
      }
    },
    [dispatch, projectId]
  );

  const handleSetPassword = useCallback(
    async (props: SetPasswordProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      const result = await dispatch(setPasswordThunk({
        projectId,
        ...props,
      }));

      if (setPasswordThunk.rejected.match(result)) {
        throw toAuthError(result.payload);
      }
    },
    [dispatch, projectId]
  );

  const handleRequestNewAccessToken = useCallback(async () => {
    // Throws, like every other action here. Resolving `undefined` on this path
    // was the other half of the ambiguity below: a caller could not tell "there
    // is no project" from "the refresh produced nothing", and the declared
    // `string | undefined` advertised a resolved-undefined that no other path
    // produces any more.
    if (!projectId) {
      throw new SublayError("No projectId available.");
    }

    const result = await dispatch(requestNewAccessTokenThunk({ projectId }));

    // Guard on the payload, and THROW on failure.
    //
    // This used to return `undefined` for every failure — including a rejected
    // refresh and a stored entry with no refresh token at all — which is
    // indistinguishable from the no-projectId early return above and reads as
    // a successful call that simply had nothing to do. Every other action on
    // this hook throws on failure; this one now agrees with them.
    if (
      requestNewAccessTokenThunk.fulfilled.match(result) &&
      result.payload
    ) {
      return result.payload;
    }

    throw result.payload
      ? toAuthError(result.payload)
      : new SublayError("Failed to request a new access token");
  }, [dispatch, projectId]);

  const handleSetRefreshToken = useCallback((token: React.SetStateAction<string | null>) => {
    // Handle both direct value and function setter patterns
    if (typeof token === 'function') {
      const currentToken = refreshToken;
      const newToken = token(currentToken);
      dispatch(setRefreshToken(newToken));
    } else {
      dispatch(setRefreshToken(token));
    }
  }, [dispatch, refreshToken]);

  return {
    initialized,
    accessToken,
    refreshToken,
    setRefreshToken: handleSetRefreshToken,
    signUpWithEmailAndPassword: handleSignUpWithEmailAndPassword,
    signInWithEmailAndPassword: handleSignInWithEmailAndPassword,
    signOut: handleSignOut,
    changePassword: handleChangePassword,
    setPassword: handleSetPassword,
    requestNewAccessToken: handleRequestNewAccessToken,
  };
}