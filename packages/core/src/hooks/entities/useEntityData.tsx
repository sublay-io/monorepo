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
 * top-comment options the entity fetch hooks take. Allowed on every variant
 * so an identifier picked at runtime can share them; with `entity` they are
 * ignored (the entity is used as given).
 */
type EntityFetchOptions = TopCommentsParams & {
  include?: EntityIncludeParam;
};

export type UseEntityDataProps = EntityFetchOptions &
  (
    | {
        entity: Entity;
        entityId?: undefined;
        foreignId?: undefined;
        shortId?: undefined;
        createIfNotFound?: undefined;
      }
    | {
        entity?: undefined;
        entityId: string;
        foreignId?: undefined;
        shortId?: undefined;
        createIfNotFound?: undefined;
      }
    | {
        entity?: undefined;
        entityId?: undefined;
        foreignId?: undefined;
        shortId: string;
        createIfNotFound?: undefined;
      }
    | {
        entity?: undefined;
        entityId?: undefined;
        foreignId: string;
        shortId?: undefined;
        createIfNotFound?: boolean;
      }
  );

/**
 * The fetch options as a string, for the cache key and for telling whether the
 * held entity was fetched with the current options. It is built from what the
 * fetch hooks actually send: `include` joined with commas as given (order and
 * case are kept, as they are in the request), and the top-comment options only when `include` asks for
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

const NO_OPTIONS_KEY = fetchOptionsKey({});

/**
 * The cache entry the held entity belongs to: identifier key, options key,
 * and the Sublay id of the entity loaded there (null for a "not found"), so
 * an entity that isn't that one is never written into the entry.
 */
type HeldKey = { id: string; options: string; entityId: string | null };
const NOT_LOADED = Symbol("not loaded");

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

  // Cache of entities by identifier, then by fetch options, so going back to
  // options used before shows that entity without a request.
  const entityCache = useRef<Record<string, Record<string, Entity>>>({});

  // The options the held entity was fetched with. When they change, the
  // entity is fetched again even though it matches the identifier.
  const heldOptionsKeyRef = useRef(optionsKey);

  // The cache entry the held entity belongs to (null when it didn't come from
  // a fetch by identifier), and the last value this hook itself put in state,
  // so a change made from outside (an edit merged in, a comment count, a
  // delete) can be told apart and written back to its entry.
  const heldCacheKeyRef = useRef<HeldKey | null>(null);

  // The identifier the request in flight is for (null when none), so clearing
  // the entity cancels only a request for that same identifier.
  const inFlightIdKeyRef = useRef<string | null>(null);
  const loadedValueRef = useRef<Entity | null | undefined | typeof NOT_LOADED>(
    NOT_LOADED,
  );

  // The held entity, read by the fetch effect without being one of its
  // dependencies, so a local change doesn't start another request.
  const entityRef = useRef(entity);
  entityRef.current = entity;

  // Every run of the fetch effect bumps this, and a response only lands if
  // no later run has happened: whatever a run decides (a fetch, the cache,
  // keeping the held entity, an entity prop) supersedes what was in flight.
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

    const deletedId = entity.id;
    try {
      await deleteEntity({ entityId: deletedId });
      // Only what was deleted: the provider may have moved on to another
      // entity while the request was out.
      for (const [idKey, byOptions] of Object.entries(entityCache.current)) {
        if (Object.values(byOptions).some((cached) => cached.id === deletedId)) {
          delete entityCache.current[idKey];
        }
      }
      setEntity((current) => (current?.id === deletedId ? undefined : current));
    } catch (err) {
      handleError(err, "Failed to delete entity");
    }
  }, [entity, deleteEntity]);

  const showLoaded = (value: Entity | null, key: HeldKey) => {
    heldCacheKeyRef.current = key;
    loadedValueRef.current = value;
    setEntity(value);
  };

  // A change to the held entity made from outside this hook's loading (an
  // edit merged in, a comment count, `setEntity`, a delete) is written back
  // to its cache entry, and the identifier's entries for other options are
  // dropped, since they no longer match it. Clearing the entity drops them
  // all and cancels a request in flight for that same identifier, so nothing
  // brings it back. Declared before the fetch effect so, when a change and
  // a switch of identifier land in one commit, the change is filed under the
  // identifier it was made on; and an entity that isn't the one loaded under
  // the held entry is never written into it.
  useEffect(() => {
    if (entity === loadedValueRef.current) return;
    const held = heldCacheKeyRef.current;
    if (!held) return;
    if (entity === undefined || entity === null) {
      delete entityCache.current[held.id];
      heldCacheKeyRef.current = null;
      if (inFlightIdKeyRef.current === held.id) requestSeqRef.current += 1;
      return;
    }
    if (entity.id !== held.entityId) return;
    entityCache.current[held.id] = { [held.options]: entity };
  }, [entity]);

  useEffect(() => {
    const handleFetchEntity = async () => {
      const requestSeq = ++requestSeqRef.current;

      if (!foreignId && !entityId && !shortId) {
        // An entity prop (or nothing): the options don't apply.
        heldCacheKeyRef.current = null;
        heldOptionsKeyRef.current = NO_OPTIONS_KEY;
        return;
      }

      const idKey = `${entityId ?? ""}-${foreignId ?? ""}-${shortId ?? ""}`;
      const keyFor = (loaded: Entity | null): HeldKey => ({
        id: idKey,
        options: optionsKey,
        entityId: loaded?.id ?? null,
      });

      const userChanged = fetchedForUserRef.current !== userId;
      fetchedForUserRef.current = userId;
      if (userChanged) {
        entityCache.current = {};
        // The held entity was the previous user's: not written back.
        heldCacheKeyRef.current = null;
      } else if (heldOptionsKeyRef.current === optionsKey) {
        // Already holding this entity, fetched with these options.
        const held = entityRef.current;
        if (
          held &&
          ((entityId && held.id === entityId) ||
            (foreignId && held.foreignId === foreignId) ||
            (shortId && held.shortId === shortId))
        ) {
          heldCacheKeyRef.current = keyFor(held);
          return;
        }
      }

      // If we have a cached entity, update the state and exit.
      const cached = entityCache.current[idKey]?.[optionsKey];
      if (cached) {
        heldOptionsKeyRef.current = optionsKey;
        showLoaded(cached, keyFor(cached));
        return;
      }

      inFlightIdKeyRef.current = idKey;
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

        // Superseded by a later run. A local change made while this request
        // was in flight (and not superseded) is replaced by the response:
        // there is no general way to tell which of the two is newer.
        if (requestSeq !== requestSeqRef.current) return;
        heldOptionsKeyRef.current = optionsKey;

        if (fetchedEntity) {
          (entityCache.current[idKey] ??= {})[optionsKey] = fetchedEntity;
        }
        showLoaded(fetchedEntity, keyFor(fetchedEntity));
      } catch (err) {
        // The held entity (if any) stays.
        handleError(err, "Failed to fetch entity");
      } finally {
        if (requestSeq === requestSeqRef.current) inFlightIdKeyRef.current = null;
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
