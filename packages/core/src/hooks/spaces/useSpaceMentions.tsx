import { useState, useCallback } from "react";
import { Space } from "../../interfaces/models/Space";
import { Mention } from "../../interfaces/models/Mention";
import useFetchManySpaces from "./useFetchManySpaces";
import useMentionSuggestions, {
  DEFAULT_MENTION_PATTERN,
  escapeRegex,
} from "../utils/useMentionSuggestions";

export interface UseSpaceMentionsProps {
  content: string;
  setContent: (value: string) => void;
  focus: () => void;
  cursorPosition: number;
  isSelectionActive: boolean;
  trigger?: string;
  minChars?: number;
  debounceDelay?: number;
  validPattern?: string;
}

export interface UseSpaceMentionsValues {
  isSpaceMentionActive: boolean;
  loading: boolean;
  spaceMentionSuggestions: Space[];
  handleSpaceMentionClick: (space: Space) => void;
  mentions: Mention[];
  addSpaceMention: (space: Space) => void;
  resetSpaceMentions: () => void;
}

const useSpaceMentions = ({
  content,
  setContent,
  focus,
  cursorPosition,
  isSelectionActive,
  trigger = "#",
  minChars = 3,
  debounceDelay = 1000,
  validPattern = DEFAULT_MENTION_PATTERN,
}: UseSpaceMentionsProps): UseSpaceMentionsValues => {
  const fetchManySpaces = useFetchManySpaces();

  const [mentions, setMentions] = useState<Mention[]>([]);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      const result = await fetchManySpaces({ searchAny: query, limit: 5 });
      return result.data;
    },
    [fetchManySpaces]
  );

  const {
    isActive: isSpaceMentionActive,
    loading,
    suggestions: spaceMentionSuggestions,
    query: mentionTrigger,
    markPicked,
    reset,
  } = useMentionSuggestions<Space>({
    content,
    cursorPosition,
    isSelectionActive,
    trigger,
    minChars,
    debounceDelay,
    validPattern,
    fetchSuggestions,
    errorMessage: "Error fetching space suggestions",
  });

  const resetSpaceMentions = () => {
    setMentions([]);
    reset();
  };

  const addSpaceMention = (space: Space) => {
    if (!space.slug) throw new Error("Space has no slug set");
    setMentions((prevMentions) => {
      if (prevMentions.some((mention) => mention.id === space.id)) {
        return prevMentions;
      }

      return [
        ...prevMentions,
        {
          id: space.id,
          slug: space.slug!,
          type: "space" as const,
        },
      ];
    });
  };

  const handleSpaceMentionClick = (space: Space) => {
    const mentionRegex = new RegExp(
      `${escapeRegex(trigger)}${escapeRegex(mentionTrigger)}(\\s|$)`
    );
    const nextContent = content.replace(mentionRegex, `${trigger}${space.slug} `);
    markPicked(nextContent);
    setContent(nextContent);

    addSpaceMention(space);
    focus();
  };

  return {
    isSpaceMentionActive,
    loading,
    spaceMentionSuggestions,
    handleSpaceMentionClick,
    mentions,
    addSpaceMention,
    resetSpaceMentions,
  };
};

export default useSpaceMentions;
