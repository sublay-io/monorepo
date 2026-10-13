import { useState, useEffect, useCallback, useRef } from "react";
import { handleError } from "../../utils/handleError";

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface UseMentionSuggestionsProps<T> {
  content: string;
  cursorPosition: number;
  isSelectionActive: boolean;
  trigger: string;
  minChars: number;
  debounceDelay: number;
  validPattern: string;
  /** Looks up suggestions for the text typed after the trigger. Keep it stable. */
  fetchSuggestions: (query: string) => Promise<T[] | null | undefined>;
  /** Passed to handleError when the lookup fails. */
  errorMessage: string;
}

export interface UseMentionSuggestionsValues<T> {
  isActive: boolean;
  loading: boolean;
  suggestions: T[];
  /** The text typed after the trigger, while suggestions are active. */
  query: string;
  /** Call when a suggestion is picked, with the text as the pick leaves it. */
  markPicked: (nextContent: string) => void;
  /** Close the suggestions and forget the current query. */
  reset: () => void;
}

/**
 * The part every mention hook shares: watching the word before the cursor
 * for a trigger, looking up suggestions for it after a pause, and staying
 * closed once one has been picked. What a mention is (a user, a space) and
 * how picks are recorded is up to the hook that uses this.
 */
function useMentionSuggestions<T>({
  content,
  cursorPosition,
  isSelectionActive,
  trigger,
  minChars,
  debounceDelay,
  validPattern,
  fetchSuggestions,
  errorMessage,
}: UseMentionSuggestionsProps<T>): UseMentionSuggestionsValues<T> {
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set when a suggestion is picked: the text and cursor position as they are
  // right after the pick. The pick changes the text without moving the
  // caller's reported cursor, so the word "before the cursor" still looks
  // like the trigger that was just completed; without this the suggestions
  // would open again at once. It holds until the text or the cursor changes.
  const pickedRef = useRef<{ content: string; cursorPosition: number } | null>(
    null
  );

  const reset = () => {
    setIsActive(false);
    setQuery("");
    setSuggestions([]);
    setLoading(false);
  };

  const markPicked = (nextContent: string) => {
    pickedRef.current = { content: nextContent, cursorPosition };

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    reset();
  };

  const handleFetchSuggestions = useCallback(
    async (text: string) => {
      try {
        const found = await fetchSuggestions(text);

        if (found && found.length > 0) {
          setSuggestions(found); // Replace with fetched data
        } else {
          setSuggestions([]);
          setIsActive(false);
        }
      } catch (err) {
        handleError(err, errorMessage);
      } finally {
        setLoading(false); // Set to false after data is fetched
      }
    },
    [fetchSuggestions, errorMessage]
  );

  useEffect(() => {
    // Right after a pick, nothing has been typed yet: stay closed.
    const picked = pickedRef.current;
    if (picked) {
      if (
        picked.content === content &&
        picked.cursorPosition === cursorPosition
      ) {
        return;
      }
      // The pick has not reached `content` yet (the caller applies it on its
      // next render): keep waiting. Anything else is the user typing or moving
      // the cursor, so normal detection resumes.
      if (picked.content !== content && picked.cursorPosition === cursorPosition) {
        return;
      }
      pickedRef.current = null;
    }

    let start = cursorPosition - 1;

    // Move backward from cursor to find the word directly before the cursor
    // (any whitespace ends a word, so a trigger can start a new line)
    while (start >= 0 && !/\s/.test(content[start])) {
      start--;
    }

    // Extract potential trigger word (start + 1 because `start` is on the space)
    const potentialTrigger = content.slice(start + 1, cursorPosition);

    const validMentionPattern = new RegExp(
      "^" + escapeRegex(trigger) + validPattern + "$"
    );

    if (
      !isSelectionActive &&
      validMentionPattern.test(potentialTrigger) &&
      potentialTrigger.length >= trigger.length + minChars
    ) {
      const triggerText = potentialTrigger.slice(trigger.length);
      setQuery(triggerText);
      setIsActive(true);
      setLoading(true);

      // Clear the previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        handleFetchSuggestions(triggerText);
      }, debounceDelay);
    } else {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setQuery("");
      setIsActive(false);
      setSuggestions([]);
      setLoading(false);
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
    handleFetchSuggestions,
    content,
    trigger,
    minChars,
    debounceDelay,
    validPattern,
  ]);

  return { isActive, loading, suggestions, query, markPicked, reset };
}

export default useMentionSuggestions;
