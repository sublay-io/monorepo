import { useCallback, useEffect, useRef } from "react";
import { useStore } from "react-redux";
import { useSublayDispatch, useSublaySelector } from "../../../store/hooks";
import type { SublayState } from "../../../store/sublayReducers";
import {
  runSharedListLoad,
  useSharedListStatus,
} from "../../list/sharedListStatus";
import {
  selectConversationList,
  selectConversationListHasMore,
  selectConversationListLoading,
  selectConversationListCursor,
  selectSocketConnected,
  setConversationList,
  setConversationListLoading,
  setConversationListHasMore,
  setConversationListCursor,
  insertConversationPreview,
} from "../../../store/slices/chatSlice";
import {
  Conversation,
  ConversationPreview,
  ConversationType,
} from "../../../interfaces/models/Conversation";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import useFetchConversationPreview from "./useFetchConversationPreview";
import { CursorPaginatedResponse } from "../../../interfaces/PaginatedResponse";
import { appendImageSlot, type ImageSlotUpload } from "../../../utils/uploads";

export interface UseConversationsProps {
  types?: ConversationType[];
}

export interface CreateGroupParams {
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  // Initial members to add at creation time (the server creates their member
  // rows in the same transaction). The creator is added as admin automatically
  // and is de-duplicated server-side if present here.
  memberIds?: string[];
  /**
   * The group's avatar image, processed per `options` (`mode` is required).
   * When present the request is sent as multipart form data.
   */
  avatarFile?: ImageSlotUpload;
}

export interface UseConversationsValues {
  conversations: ConversationPreview[];
  loading: boolean;
  /** The last load failure, shared by every hook showing the inbox. Cleared when the next load starts; `loadMore()` retries it. */
  error: Error | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;
  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while a page is loading or when there is nothing
   * more. Never rejects.
   */
  loadMore: () => Promise<void>;
  /**
   * Reload the first page. The conversations stay until the new page
   * replaces them. Never rejects.
   */
  refetch: () => Promise<void>;
  // Resolves to the created conversation. The group's inbox row (its
  // preview) is fetched and added to `conversations`.
  createGroup: (params: CreateGroupParams) => Promise<Conversation>;
}

function useConversations({
  types,
}: UseConversationsProps = {}): UseConversationsValues {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const axios = useAxiosPrivate();
  const fetchConversationPreview = useFetchConversationPreview();

  const conversations = useSublaySelector(selectConversationList);
  const loading = useSublaySelector(selectConversationListLoading);
  const hasMore = useSublaySelector(selectConversationListHasMore);
  const socketConnected = useSublaySelector(selectSocketConnected);

  const typesKey = types ? [...types].sort().join(",") : "";

  // Load bookkeeping shared by every hook showing the inbox.
  const store = useStore<{ sublay: SublayState }>();
  const { status, error } = useSharedListStatus("conversations");

  // Load the first page (`first`), or the page after the cursor of the last
  // one loaded.
  const loadPage = useCallback(
    (first: boolean) =>
      runSharedListLoad(
        status,
        first,
        async (isCurrent) => {
          if (!projectId) return;
          const cursor = first ? null : selectConversationListCursor(store.getState());
          if (!first && !cursor) return;

          dispatch(setConversationListLoading(true));
          try {
            const params: Record<string, string> = { limit: "20" };
            if (types && types.length > 0) params.types = types.join(",");
            if (cursor) params.cursor = cursor;

            const response = await axios.get<
              CursorPaginatedResponse<ConversationPreview>
            >(`/${projectId}/chat/conversations`, { params });
            if (!isCurrent()) return;

            const {
              data: items,
              pagination: { nextCursor: next, hasMore: more },
            } = response.data;

            if (first) {
              dispatch(setConversationList(items));
            } else {
              // Append to existing list, deduplicating by id
              const current = selectConversationList(store.getState());
              dispatch(
                setConversationList(
                  current.concat(
                    items.filter((item) => !current.some((c) => c.id === item.id))
                  )
                )
              );
            }
            dispatch(setConversationListCursor(next));
            dispatch(setConversationListHasMore(more));
          } finally {
            if (isCurrent()) dispatch(setConversationListLoading(false));
          }
        },
        "Failed to load conversations:"
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, store, dispatch, axios, projectId, typesKey]
  );

  // Initial fetch on mount (or when types/projectId changes)
  useEffect(() => {
    if (!projectId) return;
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, typesKey]);

  const loadMore = useCallback(async () => {
    if (!projectId || status.inFlight) return;
    if (status.failed === "first") {
      await loadPage(true);
    } else if (
      status.failed === "next" ||
      selectConversationListHasMore(store.getState())
    ) {
      await loadPage(false);
    }
  }, [projectId, status, store, loadPage]);

  const refetch = useCallback(async () => {
    if (!projectId) return;
    await loadPage(true);
  }, [projectId, loadPage]);

  // Reconnect reconciliation: when the socket transitions disconnected → connected,
  // reload the first page (respecting `types`) so the inbox self-heals any order /
  // membership / unread drift from events missed while offline. Deep pagination
  // resets to the first page — acceptable per the PRD's "self-heal" contract.
  // The *first* connect is skipped (the mount effect already loaded page 1), and
  // we only react to real connected-state changes — not `refetch` identity churn
  // when `types` changes. Mounting while already connected counts as that first
  // connect, so the next reconnect reloads.
  const prevConnectedRef = useRef(socketConnected);
  const hasConnectedOnceRef = useRef(socketConnected);
  useEffect(() => {
    const prev = prevConnectedRef.current;
    if (prev === socketConnected) return;
    prevConnectedRef.current = socketConnected;

    if (socketConnected) {
      if (hasConnectedOnceRef.current) {
        refetch();
      }
      hasConnectedOnceRef.current = true;
    }
  }, [socketConnected, refetch]);

  const createGroup = useCallback(
    async (params: CreateGroupParams): Promise<Conversation> => {
      if (!projectId) throw new Error("No project ID");

      const path = `/${projectId}/chat/conversations`;
      const { avatarFile, ...fields } = params;
      let response: { data: Conversation };

      if (avatarFile) {
        // The avatar goes as multipart form data; every other field as a
        // string (objects and arrays as JSON).
        const formData = new FormData();
        formData.append("type", "group");
        for (const [key, value] of Object.entries(fields)) {
          if (value === undefined) continue;
          formData.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : String(value)
          );
        }
        appendImageSlot(formData, "avatarFile", avatarFile);
        response = await axios.post<Conversation>(path, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await axios.post<Conversation>(path, {
          type: "group",
          ...fields,
        });
      }

      const conversation = response.data;

      // The create returns the bare conversation; the inbox holds previews,
      // so fetch the new group's preview and insert that.
      try {
        const preview = await fetchConversationPreview({
          conversationId: conversation.id,
        });
        dispatch(insertConversationPreview(preview));
      } catch {
        // ignore — the group is created; the next refetch lists it
      }

      return conversation;
    },
    [projectId, axios, dispatch, fetchConversationPreview]
  );

  return {
    conversations,
    loading,
    error,
    // A failed load is still to do: `loadMore()` retries it.
    hasMore: hasMore || error !== null,
    loadMore,
    refetch,
    createGroup,
  };
}

export default useConversations;
