import { useEffect, useRef } from "react";
import { User, useCommentSection } from "@sublay/react-js";
import UserAvatar from "~shared/react/user-avatar";
import { UserMentionSkeleton } from "~shared/react/skeleton";
import { cn } from "~shared/react/cn";
import strings from "../utils/strings";

interface MentionSuggestionsProps {
  isMentionActive: boolean;
  isLoadingMentions: boolean;
  mentionSuggestions: User[];
  handleMentionClick: (user: User) => void;
  // Which side of the form the list opens on. "above" suits a form at the
  // bottom of the section; "below" suits one with content right above it,
  // like the reply form under the comment it replies to.
  placement?: "above" | "below";
}

function MentionSuggestions({
  isMentionActive,
  isLoadingMentions,
  mentionSuggestions,
  handleMentionClick,
  placement = "above",
}: MentionSuggestionsProps) {
  const { callbacks } = useCommentSection();

  // Opening below can put the list past the bottom edge of the scrolling
  // comments feed (a reply box near the bottom): bring it into view.
  const listRef = useRef<HTMLDivElement>(null);
  const suggestionCount = mentionSuggestions.length;
  useEffect(() => {
    if (placement === "below" && isMentionActive) {
      listRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [placement, isMentionActive, isLoadingMentions, suggestionCount]);

  if (!isMentionActive) return null;

  return (
    <div
      ref={listRef}
      className={cn(
        "absolute left-0 right-0 z-50 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-600 shadow-lg max-h-[200px] overflow-y-auto",
        placement === "below" ? "top-full mt-2 scroll-mb-2" : "bottom-full mb-2"
      )}
    >
      <div className="p-3">
        {isLoadingMentions ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <UserMentionSkeleton key={i} />
            ))}
          </div>
        ) : mentionSuggestions.length > 0 ? (
          <div className="flex flex-col gap-1">
            {mentionSuggestions.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  if (!user.username) {
                    callbacks?.userCantBeMentionedCallback?.();
                    return;
                  }
                  handleMentionClick(user);
                }}
                className="cursor-pointer flex items-center gap-3 p-2 rounded-lg transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-neutral-700"
              >
                <UserAvatar user={user} size={32} />
                <div className="flex flex-col gap-0.5">
                  <div className="text-sm font-medium text-gray-900 dark:text-neutral-50">
                    @{user.username}
                  </div>
                  {user.name && (
                    <div className="text-[13px] font-normal text-gray-500 dark:text-neutral-400">
                      {user.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500 dark:text-neutral-400 text-sm">
            {strings.noUsersFound}
          </div>
        )}
      </div>
    </div>
  );
}

export default MentionSuggestions;