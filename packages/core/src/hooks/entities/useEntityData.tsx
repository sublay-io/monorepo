import { useCallback, useEffect, useRef, useState } from "react";
import { useStableObject } from "../useStableObject";

import useFetchEntity from "./useFetchEntity";
import useFetchEntityByForeignId from "./useFetchEntityByForeignId";
import useFetchOrCreateEntityByForeignId from "./useFetchOrCreateEntityByForeignId";
import useFetchEntityByShortId from "./useFetchEntityByShortId";
import useUpdateEntity, {
  UpdateEntityProps,
  applyEntityUpdate,
} from "./useUpdateEntity";
import useDeleteEntity from "./useDeleteEntity";

import {
  Entity,
  EntityIncludeParam,
  TopCommentsParams,
} from "../../interfaces/models/Entity";
import { handleError } from "../../utils/handleError";
import { sendableTopCommentsParams } from "../../utils/topCommentsParams";
import { useSublaySelector } from "../../store/hooks";
import { selectUser as selectAuthUser } from "../../store/slices/authSlice";

/**
 * What a fetching provider asks the server to attach: the same `include` and
 * top-comment options the entity fetch hooks take.
 */
type EntityFetchOptions = TopCommentsParams & {
  include?: EntityIncludeParam;
};

/**
 * An `entity` passed in is used as given, so the fetch options don't apply to
 * it; they are typed out of that variant so passing them there is an error
 * rather than something silently ignored.
 */
type NoEntityFetchOptions = {
  [K in keyof EntityFetchOptions]?: undefined;
};

export type UseEntityDataProps =
  | ({
      entity: Entity;
      entityId?: undefined;
      foreignId?: undefined;
      shortId?: undefined;
      createIfNotFound?: undefined;
    } & NoEntityFetchOptions)
  | ({
      entity?: undefined;
      entityId: string;
      foreignId?: undefined;
      shortId?: undefined;
      createIfNotFound?: undefined;
    } & EntityFetchOptions)
  | ({
      entity?: undefined;
      entityId?: undefined;
      foreignId?: undefined;
      shortId: string;
      createIfNotFound?: undefined;
    } & EntityFetchOptions)
  | ({
      entity?: undefined;
      entityId?: undefined;
      foreignId: string;
      shortId?: undefined;
      createIfNotFound?: boolean;
    } & EntityFetchOptions);

/**
 * The fetch options as a string, for the cache key and for telling whether the
 * held entity was fetched with the current options. It is built from what the
 * fetch hooks actually send: `include` joined with commas as given (an array
 * and the same comma string are one key; order and case are kept, as they are
 * in the request), and the top-comment options only when `include` asks for
 * `topComments` (otherwise they aren't sent, so they don't change the key).
 */
function fetchOptionsKey({
  include,
  topCommentsLimit,
  topCommentsSortByReaction,
}: EntityFetchOptions): string {
  const sentInclude = Array.isArray(include) ? include.join(",") : include;
  const topComments = sendableTopCommentsParams(
    include,
    topCommentsLimit,
    topCommentsSortByReaction,
  );
  return JSON.stringify([
    sentInclude ?? null,
    topComments.topCommentsLimit ?? null,
    topComments.topCommentsSortByReaction ?? null,
  ]);
}

export interface UseEntityDataValues {
  entity: Entity | null | undefined;
  setEntity: React.Dispatch<React.SetStateAction<Entity | null | undefined>>;
  updateEntity(
    props: Pick<UpdateEntityProps, "update">,
  ): Promise<Entity | undefined>;
  deleteEntity: () => Promise<void>;
}

function useEntityData({
  entityId,
  foreignId,
  shortId,
  entity: entityProp,
  createIfNotFound,
  include,
  topCommentsLimit,
  topCommentsSortByReaction,
}: UseEntityDataProps): UseEntityDataValues {
  const [entity, setEntity] = useState<Entity | undefined | null>(entityProp);

  // Stable while their content is the same, so an inline
  // `include={["user", "space"]}` isn't a change on every render.
  const fetchOptions = useStableObject<EntityFetchOptions>({
    include,
    topCommentsLimit,
    topCommentsSortByReaction,
  });
  const optionsKey = fetchOptionsKey(fetchOptions);

  // Cache of fetched entities, keyed by identifier + fetch options, so going
  // back to options used before shows that entity without a request.
  const entityCache = useRef<Record<string, Entity>>({});

  // The options the held entity was fetched with. When they change, the
  // entity is fetched again even though it matches the identifier.
  const heldOptionsKeyRef = useRef(optionsKey);

  // Only the latest request may set the entity: one made for options (or a
  // user) that have since changed is dropped when it lands.
  const requestSeqRef = useRef(0);

  // The entity carries the signed-in user's own reaction (`userReaction`), so
  // it is fetched again, and the cache dropped, when the user signs in, signs
  // out or switches accounts. An entity passed in as a prop is used as given.
  const userId = useSublaySelector(selectAuthUser)?.id ?? null;
  const fetchedForUserRef = useRef(userId);

  const fetchEntity = useFetchEntity();
  const fetchEntityByForeignId = useFetchEntityByForeignId();
  const fetchOrCreateEntityByForeignId = useFetchOrCreateEntityByForeignId();
  const fetchEntityByShortId = useFetchEntityByShortId();

  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();

  const handleUpdateEntity = useCallback(
    async ({ update }: Pick<UpdateEntityProps, "update">) => {
      if (!entity) return;
      try {
        const newEntity = await updateEntity({
          entityId: entity.id,
          update,
        });
        if (newEntity) setEntity((current) => applyEntityUpdate(current, newEntity));
        return newEntity;
      } catch (err) {
        handleError(err, "Failed to update entity");
      }
    },
    [entity, updateEntity],
  );

  const handleDeleteEntity = useCallback(async () => {
    if (!entity) return;

    try {
      await deleteEntity({ entityId: entity.id });
      setEntity(undefined);
    } catch (err) {
      handleError(err, "Failed to delete entity");
    }
  }, [entity, deleteEntity]);

  useEffect(() => {
    const handleFetchEntity = async () => {
      if (!foreignId && !entityId && !shortId) return;

      const userChanged = fetchedForUserRef.current !== userId;
      fetchedForUserRef.current = userId;
      if (userChanged) {
        entityCache.current = {};
      } else if (heldOptionsKeyRef.current === optionsKey) {
        // Already holding this entity, fetched with these options.
        if (entity && entityId && entity.id === entityId) return;
        if (entity && foreignId && entity.foreignId === foreignId) return;
        if (entity && shortId && entity.shortId === shortId) return;
      }

      const uniqueKey = `${entityId ?? ""}-${foreignId ?? ""}-${shortId ?? ""}-${optionsKey}`;
      const requestSeq = ++requestSeqRef.current;

      // If we have a cached entity, update the state and exit.
      if (entityCache.current[uniqueKey]) {
        heldOptionsKeyRef.current = optionsKey;
        setEntity(entityCache.current[uniqueKey]);
        return;
      }

      try {
        let fetchedEntity: Entity | null = null;
        const options = fetchOptions;

        if (entityId) {
          fetchedEntity = await fetchEntity({ entityId, ...options });
        } else if (foreignId) {
          fetchedEntity = createIfNotFound
            ? (await fetchOrCreateEntityByForeignId({ foreignId, ...options }))
                .entity
            : await fetchEntityByForeignId({ foreignId, ...options });
        } else if (shortId) {
          fetchedEntity = await fetchEntityByShortId({ shortId, ...options });
        }

        if (requestSeq !== requestSeqRef.current) return;
        heldOptionsKeyRef.current = optionsKey;

        if (fetchedEntity) {
          // Store the fetched entity in cache.
          entityCache.current[uniqueKey] = fetchedEntity;
          setEntity(fetchedEntity);
        } else {
          setEntity(null);
        }
      } catch (err) {
        handleError(err, "Failed to fetch entity");
      }
    };

    handleFetchEntity();
  }, [
    fetchEntity,
    fetchEntityByForeignId,
    fetchOrCreateEntityByForeignId,
    fetchEntityByShortId,
    entityId,
    foreignId,
    shortId,
    entity,
    createIfNotFound,
    fetchOptions,
    optionsKey,
    userId,
  ]);

  // Stable while its content is the same, so an object created again on every
  // render (an inline `entity={{ ... }}`) isn't a change.
  const stableEntityProp = useStableObject(entityProp);
  useEffect(() => {
    if (stableEntityProp) setEntity(stableEntityProp);
  }, [stableEntityProp]);

  return {
    entity,
    setEntity,
    updateEntity: handleUpdateEntity,
    deleteEntity: handleDeleteEntity,
  };
}

export default useEntityData;
