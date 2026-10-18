import React from "react";
import { View, Text, Pressable } from "react-native";
import { User, useCommentSection } from "@sublay/react-native";
import UserAvatar from "~shared/react-native/user-avatar";
import { UserMentionSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../hooks/use-ui-state";
import { SECTION_PADDING_X } from "../comments-feed/comment-thread/single-comment/indentation-threading-lines";
import strings from "../../utils/strings";

interface MentionSuggestionsProps {
  isMentionActive: boolean;
  isLoadingMentions: boolean;
  mentionSuggestions: User[];
  handleMentionClick: (user: User) => void;
}

const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  isMentionActive,
  isLoadingMentions,
  mentionSuggestions,
  handleMentionClick,
}) => {
  const { theme } = useUIState();
  const { callbacks } = useCommentSection();

  if (!isMentionActive) return null;

  return (
    <View
      // Part of the comment box, above the "Replying to" bar and the text
      // field: the box grows upward to hold the suggestions (at most 5)
      style={{
        paddingVertical: 3.5,
        // Each row has 7px padding of its own: avatars line up with the comments
        paddingHorizontal: SECTION_PADDING_X - 7,
        // 🎨 CUSTOMIZATION: Mention suggestions background
        backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
      }}
    >
      {isLoadingMentions ? (
        <View style={{ gap: 4 }}>
          {[1, 2, 3].map((item) => (
            <UserMentionSkeleton
              key={`loading-${item}`}
              theme={theme}
              avatarSize={32}
              gap={12}
              paddingVertical={8}
              paddingHorizontal={8}
            />
          ))}
        </View>
      ) : mentionSuggestions.length > 0 ? (
        <View style={{ gap: 4 }}>
          {mentionSuggestions.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                if (!item.username) {
                  callbacks?.userCantBeMentionedCallback?.();
                  return;
                }
                handleMentionClick(item);
              }}
            >
              {/* The pressed look is on a view inside: NativeWind, when the
                  app uses it, drops a `style` given as a function */}
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10.5,
                    padding: 7,
                    borderRadius: 7,
                    // 🎨 CUSTOMIZATION: Press feedback
                    backgroundColor: pressed
                      ? theme === 'dark' ? '#404040' : '#F9FAFB'
                      : 'transparent',
                    opacity: pressed ? 0.6 : 1,
                  }}
                >
                  <UserAvatar theme={theme} user={item} size={32} />
                  <View
                    style={{
                      flexDirection: 'column',
                      gap: 1.75,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12.25,
                        lineHeight: 17.5,
                        fontWeight: '500',
                        // 🎨 CUSTOMIZATION: Username color
                        color: theme === 'dark' ? '#FAFAFA' : '#111827',
                      }}
                    >
                      @{item.username}
                    </Text>
                    {item.name && (
                      <Text
                        style={{
                          fontSize: 13,
                          lineHeight: 18,
                          fontWeight: '400',
                          // 🎨 CUSTOMIZATION: Name color
                          color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
                        }}
                      >
                        {item.name}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      ) : (
        <View
          style={{
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 12.25,
              lineHeight: 17.5,
              color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
            }}
          >
            {strings.noUsersFound}
          </Text>
        </View>
      )}
    </View>
  );
};

export default MentionSuggestions;
