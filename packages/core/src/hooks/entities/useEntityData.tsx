import { useCallback, useEffect, useRef, useState } from "react";
import { useStableObject } from "../useStableObject";

import useFetchEntity from "./useFetchEntity";
import useFetchEntityByForeignId from "./useFetchEntityByForeignId";
import useFetchEntityByShortId from "./useFetchEntityByShortId";
import useUpdateEntity, { UpdateEntityProps } from "./useUpdateEntity";
import useDeleteEntity from "./useDeleteEntity";

import { Entity } from "../../interfaces/models/Entity";
import { handleError } from "../../utils/handleError";
import { useSublaySelector } from "../../store/hooks";
import { selectUser as selectAuthUser } from "../../store/slices/authSlice";

export type UseEntityDataProps =
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
    };
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
}: UseEntityDataProps): UseEntityDataValues {
  const [entity, setEntity] = useState<Entity | undefined | null>(entityProp);

  // Cache to store fetched entities keyed by unique identifier
  const entityCache = useRef<Record<string, Entity>>({});

  // The entity carries the signed-in user's own reaction (`userReaction`), so
  // it is fetched again, and the cache dropped, when the user signs in, signs
  // out or switches accounts. An entity passed in as a prop is used as given.
  const userId = useSublaySelector(selectAuthUser)?.id ?? null;
  const fetchedForUserRef = useRef(userId);

  const fetchEntity = useFetchEntity();
  const fetchEntityByForeignId = useFetchEntityByForeignId();
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
        if (newEntity) setEntity(newEntity);
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
      } else {
        if (entity && entityId && entity.id === entityId) return;
        if (entity && foreignId && entity.foreignId === foreignId) return;
        if (entity && shortId && entity.shortId === shortId) return;
      }

      const uniqueKey = `${entityId ?? ""}-${foreignId ?? ""}-${shortId ?? ""}`;

      // If we have a cached entity, update the state and exit.
      if (entityCache.current[uniqueKey]) {
        setEntity(entityCache.current[uniqueKey]);
        return;
      }

      try {
        let fetchedEntity: Entity | null = null;

        if (entityId) {
          fetchedEntity = await fetchEntity({
            entityId,
          });
        } else if (foreignId) {
          fetchedEntity = await fetchEntityByForeignId({
            foreignId,
            createIfNotFound,
          });
        } else if (shortId) {
          fetchedEntity = await fetchEntityByShortId({
            shortId,
          });
        }

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
    fetchEntityByShortId,
    entityId,
    foreignId,
    shortId,
    entity,
    createIfNotFound,
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
