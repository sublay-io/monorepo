import { useState, useCallback } from "react";
import { User } from "../../interfaces/models/User";
import { Mention } from "../../interfaces/models/Mention";
import useFetchUserSuggestions from "./useFetchUserSuggestions";
import useMentionSuggestions, {
  DEFAULT_MENTION_PATTERN,
  escapeRegex,
} from "../utils/useMentionSuggestions";

export interface UseUserMentionsProps {
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

export interface UseUserMentionsValues {
  isMentionActive: boolean;
  loading: boolean;
  mentionSuggestions: User[];
  handleMentionClick: (user: User) => void;
  mentions: Mention[];
  addMention: (user: User) => void;
  /** Replace the mentions list, e.g. to put back one saved before a reset. */
  setMentions: (mentions: Mention[]) => void;
  resetMentions: () => void;
}

const useUserMentions = ({
  content,
  setContent,
  focus,
  cursorPosition,
  isSelectionActive,
  trigger = "@",
  minChars = 3,
  debounceDelay = 1000,
  validPattern = DEFAULT_MENTION_PATTERN,
}: UseUserMentionsProps): UseUserMentionsValues => {
  const fetchMentionSuggestions = useFetchUserSuggestions();

  const [mentions, setMentions] = useState<Mention[]>([]);

  const fetchSuggestions = useCallback(
    (query: string) => fetchMentionSuggestions({ query }),
    [fetchMentionSuggestions]
  );

  const {
    isActive: isMentionActive,
    loading,
    suggestions: mentionSuggestions,
    query: mentionTrigger,
    markPicked,
    reset,
  } = useMentionSuggestions<User>({
    content,
    cursorPosition,
    isSelectionActive,
    trigger,
    minChars,
    debounceDelay,
    validPattern,
    fetchSuggestions,
    errorMessage: "Error fetching mentions",
  });

  const resetMentions = () => {
    setMentions([]);
    reset();
  };

  const addMention = (user: User) => {
    if (!user.username) throw new Error("User has no username set");
    setMentions((prevMentions) => {
      // Check if the user already exists based on id
      if (prevMentions.some((mention) => mention.id === user.id)) {
        return prevMentions; // Return the previous mentions if the user already exists
      }

      // Add the new mention if it doesn't already exist
      return [
        ...prevMentions,
        {
          id: user.id,
          foreignId: user.foreignId,
          username: user.username!,
          type: "user" as const,
        },
      ];
    });
  };

  const handleMentionClick = (user: User) => {
    const mentionRegex = new RegExp(`${escapeRegex(trigger)}${escapeRegex(mentionTrigger)}(\\s|$)`);
    const nextContent = content.replace(mentionRegex, `${trigger}${user.username} `);
    markPicked(nextContent);
    setContent(nextContent);

    addMention(user);
    focus();
  };

  return {
    isMentionActive,
    loading,
    mentionSuggestions,
    handleMentionClick,
    mentions,
    addMention,
    setMentions,
    resetMentions,
  };
};

export default useUserMentions;
