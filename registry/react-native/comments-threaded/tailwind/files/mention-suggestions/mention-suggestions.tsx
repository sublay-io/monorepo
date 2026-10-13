import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { User, useCommentSection } from "@sublay/react-native";
import UserAvatar from "~shared/react-native/user-avatar";
import { UserMentionSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../hooks/use-ui-state";
import { SECTION_PADDING_X } from "../comments-feed/comment-thread/single-comment/indentation-threading-lines";

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
      className={`h-auto max-h-[200px] absolute bottom-0 left-0 right-0 z-10 overflow-hidden p-3 rounded-xl border mb-2 ${
        theme === 'dark'
          ? 'bg-neutral-800 border-neutral-600'
          : 'bg-white border-gray-200'
      }`}
      style={{
        // In line with the input below
        marginHorizontal: SECTION_PADDING_X,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {isLoadingMentions ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => `loading-${item}`}
          renderItem={() => (
            <UserMentionSkeleton
              theme={theme}
              avatarSize={32}
              gap={12}
              paddingVertical={8}
              paddingHorizontal={8}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-1" />}
          keyboardShouldPersistTaps="always"
        />
      ) : mentionSuggestions.length > 0 ? (
        <FlatList
          data={mentionSuggestions}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }) => (
            <TouchableOpacity
              // Dim only a little, so the pressed tint shows
              activeOpacity={0.6}
              onPress={() => {
                if (!item.username) {
                  callbacks?.userCantBeMentionedCallback?.();
                  return;
                }
                handleMentionClick(item);
              }}
              className={`flex-row items-center gap-3 p-2 rounded-lg ${
                theme === 'dark' ? 'active:bg-neutral-700' : 'active:bg-gray-50'
              }`}
            >
              <UserAvatar theme={theme} user={item} size={32} />
              <View className="flex-col gap-0.5">
                <Text
                  className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-neutral-50' : 'text-gray-900'
                  }`}
                >
                  @{item.username}
                </Text>
                {item.name && (
                  <Text
                    className={`text-[13px] leading-[18px] font-normal ${
                      theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                    }`}
                  >
                    {item.name}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View className="h-1" />}
        />
      ) : (
        <View className="py-4 items-center justify-center">
          <Text
            className={`text-sm ${
              theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
            }`}
          >
            No users found
          </Text>
        </View>
      )}
    </View>
  );
};

export default MentionSuggestions;
