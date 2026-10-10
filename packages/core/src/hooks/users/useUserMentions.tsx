import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "../../interfaces/models/User";
import { Mention } from "../../interfaces/models/Mention";
import useFetchUserSuggestions from "./useFetchUserSuggestions";
import { handleError } from "../../utils/handleError";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
  validPattern = "[\\w.]+",
}: UseUserMentionsProps): UseUserMentionsValues => {
  const fetchMentionSuggestions = useFetchUserSuggestions();

  const [loadingState, setLoadingState] = useState(false);

  const [mentions, setMentions] = useState<Mention[]>([]);
  const [isMentionActive, setIsMentionActive] = useState(false);
  const [mentionTrigger, setMentionTrigger] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetMentions = () => {
    setMentions([]);
    setIsMentionActive(false);
    setMentionTrigger("");
    setMentionSuggestions([]);
    setLoadingState(false);
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
    setContent(content.replace(mentionRegex, `${trigger}${user.username} `));

    addMention(user);

    setIsMentionActive(false);
    setMentionTrigger("");
    setMentionSuggestions([]);
    setLoadingState(false);
    focus();
  };

  const handleFetchMentionSuggestions = useCallback(
    async (query: string) => {
      try {
        const suggestions = await fetchMentionSuggestions({ query });

        if (suggestions && suggestions.length > 0) {
          setMentionSuggestions(suggestions); // Replace with fetched data
        } else {
          setMentionSuggestions([]);
          setIsMentionActive(false);
        }
      } catch (err) {
        handleError(err, "Error fetching mentions");
      } finally {
        setLoadingState(false); // Set to false after data is fetched
      }
    },
    [fetchMentionSuggestions]
  );

  useEffect(() => {
    let start = cursorPosition - 1;

    // Move backward from cursor to find the word directly before the cursor
    while (start >= 0 && content[start] !== " ") {
      start--;
    }

    // Extract potential trigger word (start + 1 because `start` is on the space)
    const potentialTrigger = content.slice(start + 1, cursorPosition);

    const validMentionPattern = new RegExp("^" + escapeRegex(trigger) + validPattern + "$");

    if (
      !isSelectionActive &&
      validMentionPattern.test(potentialTrigger) &&
      potentialTrigger.length >= trigger.length + minChars
    ) {
      const triggerText = potentialTrigger.slice(trigger.length);
      setMentionTrigger(triggerText);
      setIsMentionActive(true);
      setLoadingState(true);

      // Clear the previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        handleFetchMentionSuggestions(triggerText);
      }, debounceDelay);
    } else {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setMentionTrigger("");
      setIsMentionActive(false);
      setMentionSuggestions([]);
      setLoadingState(false);
    }

    // Cleanup on component unmount to clear any remaining timer
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    cursorPosition,
    isSelectionActive,
    handleFetchMentionSuggestions,
    content,
    trigger,
    minChars,
    debounceDelay,
    validPattern,
  ]);

  return {
    isMentionActive,
    loading: loadingState,
    mentionSuggestions,
    handleMentionClick,
    mentions,
    addMention,
    setMentions,
    resetMentions,
  };
};

export default useUserMentions;
