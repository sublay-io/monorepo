import { useEffect, useRef } from "react";
import { User, useCommentSection } from "@sublay/react-js";
import UserAvatar from "~shared/react/user-avatar";
import { UserMentionSkeleton } from "~shared/react/skeleton";
import useUIState from "../hooks/use-ui-state";
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
  const { theme } = useUIState();
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
      style={{
        position: "absolute",
        ...(placement === "below"
          ? { top: "100%", marginTop: "8px", scrollMarginBottom: "8px" }
          : { bottom: "100%", marginBottom: "8px" }),
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: theme === 'dark' ? "#262626" : "#FFFFFF",
        borderRadius: "12px",
        border: theme === 'dark' ? "1px solid #525252" : "1px solid #E5E7EB",
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        maxHeight: "200px",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "12px" }}>
        {isLoadingMentions ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map((i) => (
              <UserMentionSkeleton theme={theme} key={i} />
            ))}
          </div>
        ) : mentionSuggestions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px",
                  borderRadius: "8px",
                  transition: "background-color 150ms ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? "#404040" : "#F3F4F6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <UserAvatar theme={theme} user={user} size={32} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: theme === 'dark' ? "#FAFAFA" : "#111827",
                    }}
                  >
                    @{user.username}
                  </div>
                  {user.name && (
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "400",
                        color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
                      }}
                    >
                      {user.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "16px",
              textAlign: "center" as const,
              color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
              fontSize: "14px",
            }}
          >
            {strings.noUsersFound}
          </div>
        )}
      </div>
    </div>
  );
}

export default MentionSuggestions;