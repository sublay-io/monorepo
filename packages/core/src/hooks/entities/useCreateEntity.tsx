import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { Entity } from "../../interfaces/models/Entity";
import useProject from "../projects/useProject";
import { Mention } from "../../interfaces/models/Mention";
import {
  appendFileList,
  appendImageList,
  hasListFiles,
  type FileListUpload,
  type ImageListUpload,
} from "../../utils/uploads";
import { SublayError } from "../../errors/SublayError";

export interface CreateEntityProps {
  foreignId?: string;
  /**
   * Where the entity comes from (free text, e.g. `"blog"`). `"none"`,
   * `"null"` and `"undefined"` are reserved and refused. For no source, leave
   * it out or pass `null`.
   */
  sourceId?: string | null;
  spaceId?: string;
  title?: string;
  content?: string;
  attachments?: Record<string, any>[];
  keywords?: string[];
  mentions?: Mention[];
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  nsfw?: boolean;
  isDraft?: boolean;
  /**
   * Images, processed into sizes per `options` (`mode` is required). Sends
   * multipart. Requires the files-images bundle.
   */
  images?: ImageListUpload;
  /**
   * Files stored as uploaded (`options.pathParts` optional). Sends multipart.
   * Requires the files-images bundle.
   */
  files?: FileListUpload;
}

function useCreateEntity(): (props: CreateEntityProps) => Promise<Entity> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const createEntity = useCallback(
    async (props: CreateEntityProps) => {
      const {
        foreignId,
        sourceId,
        spaceId,
        title,
        content,
        attachments,
        keywords,
        mentions,
        location,
        metadata,
        nsfw,
        isDraft,
        images,
        files,
      } = props;

      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      const hasImages = hasListFiles(images);
      const hasFiles = hasListFiles(files);

      if (hasImages || hasFiles) {
        // Multipart: the files go as `images` / `files` with their options as
        // `images.options` / `files.options`; object fields as JSON strings.
        const formData = new FormData();

        if (foreignId !== undefined) formData.append("foreignId", foreignId);
        // Multipart has no null: "no source" is the field left out.
        if (sourceId != null) formData.append("sourceId", sourceId);
        if (spaceId !== undefined) formData.append("spaceId", spaceId);
        if (title !== undefined) formData.append("title", title);
        if (content !== undefined) formData.append("content", content);
        if (attachments !== undefined) formData.append("attachments", JSON.stringify(attachments));
        if (keywords !== undefined) formData.append("keywords", JSON.stringify(keywords));
        if (mentions !== undefined) formData.append("mentions", JSON.stringify(mentions));
        if (location !== undefined) formData.append("location", JSON.stringify(location));
        if (metadata !== undefined) formData.append("metadata", JSON.stringify(metadata));
        if (nsfw !== undefined) formData.append("nsfw", nsfw.toString());
        if (isDraft !== undefined) formData.append("isDraft", isDraft.toString());

        if (hasImages) appendImageList(formData, images!);
        if (hasFiles) appendFileList(formData, files!);

        const response = await axios.post<Entity>(
          `/${projectId}/entities`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        return response.data as Entity;
      } else {
        const response = await axios.post<Entity>(
          `/${projectId}/entities`,
          {
            foreignId,
            sourceId,
            spaceId,
            title,
            content,
            attachments,
            keywords,
            mentions,
            location,
            metadata,
            nsfw,
            isDraft,
          },
        );

        return response.data as Entity;
      }
    },
    [projectId, axios]
  );

  return createEntity;
}

export default useCreateEntity;
