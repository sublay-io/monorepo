import { useCallback, useEffect, useRef } from "react";
import { useSublayDispatch, useSublaySelector } from "../../../store/hooks";
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
import { handleError } from "../../../utils/handleError";
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
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
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
  // `pagination.nextCursor` of the last page loaded, kept in the store
  const nextCursor = useSublaySelector(selectConversationListCursor);
  const socketConnected = useSublaySelector(selectSocketConnected);

  const typesKey = types ? [...types].sort().join(",") : "";

  // Keep fresh refs to avoid stale closures in useCallback
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const fetchPage = useCallback(
    async (cursor: string | null, isRefresh: boolean) => {
      if (!projectId) return;

      dispatch(setConversationListLoading(true));
      try {
        const params: Record<string, string> = { limit: "20" };
        if (types && types.length > 0) params.types = types.join(",");
        if (cursor) params.cursor = cursor;

        const response = await axios.get<
          CursorPaginatedResponse<ConversationPreview>
        >(`/${projectId}/chat/conversations`, { params });

        const {
          data: items,
          pagination: { nextCursor: next, hasMore: more },
        } = response.data;

        if (isRefresh) {
          dispatch(setConversationList(items));
        } else {
          // Append to existing list, deduplicating by id
          const current = conversationsRef.current;
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
      } catch (err) {
        handleError(err, "Failed to load conversations");
      } finally {
        dispatch(setConversationListLoading(false));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, typesKey]
  );

  // Initial fetch on mount (or when types/projectId changes)
  useEffect(() => {
    if (!projectId) return;
    fetchPage(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, typesKey]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !nextCursor) return;
    await fetchPage(nextCursor, false);
  }, [loading, hasMore, nextCursor, fetchPage]);

  const refresh = useCallback(async () => {
    await fetchPage(null, true);
  }, [fetchPage]);

  // Reconnect reconciliation: when the socket transitions disconnected → connected,
  // reload the first page (respecting `types`) so the inbox self-heals any order /
  // membership / unread drift from events missed while offline. Deep pagination
  // resets to the first page — acceptable per the PRD's "self-heal" contract.
  // The *first* connect is skipped (the mount effect already loaded page 1), and
  // we only react to real connected-state changes — not `refresh` identity churn
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
        refresh();
      }
      hasConnectedOnceRef.current = true;
    }
  }, [socketConnected, refresh]);

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
        // ignore — the group is created; the next refresh lists it
      }

      return conversation;
    },
    [projectId, axios, dispatch, fetchConversationPreview]
  );

  return { conversations, loading, hasMore, loadMore, refresh, createGroup };
}

export default useConversations;
