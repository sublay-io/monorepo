import { SublayHttpClient } from "../../core/client";
import { AuthUser } from "../../interfaces/User";
import { ImageOptions } from "../../interfaces/ImageProcessing";
import {
  appendField,
  appendFields,
  appendFile,
  refuseNullWithFile,
} from "../../core/multipart";

/** A file plus the image-processing options the server requires alongside it. */
export interface UserImageUpload {
  file: Blob | File;
  /** Image-processing config (must include `mode`) — see {@link ImageOptions}. */
  options: ImageOptions;
}

export interface UpdateUserProps {
  /** The user to update (the target). A user token may only update itself. */
  userId: string;
  /** `null` (or an empty string) clears it, on a call without a file. */
  name?: string | null;
  username?: string;
  /**
   * The avatar as an image URL; `null` clears it, on a call without a file.
   * To upload an image, use `avatarFile`.
   */
  avatar?: string | null;
  /** `null` (or an empty string) clears it, on a call without a file. */
  bio?: string | null;
  /**
   * A `Date`, or a full UTC timestamp string such as
   * `"1990-05-17T00:00:00.000Z"` (a date alone, like `"1990-05-17"`, is refused).
   */
  birthdate?: string | Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  secureMetadata?: Record<string, any>;
  /**
   * New avatar image. When present the request is sent as `multipart/form-data`.
   * The server processes the image per `options` and replaces the old avatar.
   */
  avatarFile?: UserImageUpload;
  /** New banner image; same contract as {@link UpdateUserProps.avatarFile}. */
  bannerFile?: UserImageUpload;
  /**
   * Files to remove: the user's `avatarFileId` and/or `bannerFileId` (no other
   * id is accepted). Removing one clears that image. Works with or without
   * uploads in the same request.
   */
  removeFileIds?: string[];
}

export async function updateUser(
  client: SublayHttpClient,
  data: UpdateUserProps
): Promise<AuthUser> {
  const { userId, avatarFile, bannerFile, ...body } = data;
  const path = `/users/${userId}`;

  if (avatarFile || bannerFile) {
    refuseNullWithFile("updateUser", body);
    const formData = new FormData();

    // Files go under `avatarFile`/`bannerFile`; their options ride alongside as
    // `<field>.options` JSON strings (the server's parseImageOptions middleware
    // parses them back).
    if (avatarFile) {
      appendFile(formData, "avatarFile", avatarFile.file, { fallback: "avatar" });
      appendField(formData, "avatarFile.options", avatarFile.options);
    }
    if (bannerFile) {
      appendFile(formData, "bannerFile", bannerFile.file, { fallback: "banner" });
      appendField(formData, "bannerFile.options", bannerFile.options);
    }

    // Object fields (location/metadata/secureMetadata) must be stringified; the
    // server reads them via jsonOrObject. Scalars go as plain strings.
    appendFields(formData, body);

    const response = await client.projectInstance.patch<AuthUser>(
      path,
      formData
    );
    return response.data;
  }

  const response = await client.projectInstance.patch<AuthUser>(path, body);
  return response.data;
}
