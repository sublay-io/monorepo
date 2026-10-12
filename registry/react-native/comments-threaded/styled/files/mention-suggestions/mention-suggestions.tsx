import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { User, useCommentSection } from "@sublay/react-native";
import UserAvatar from "~shared/react-native/user-avatar";
import { UserMentionSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../hooks/use-ui-state";

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
      style={{
        height: 'auto',
        maxHeight: 200,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        overflow: 'hidden',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
        marginHorizontal: 8,
        // 🎨 CUSTOMIZATION: Mention suggestions background and border
        backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
        borderColor: theme === 'dark' ? '#525252' : '#E5E7EB',
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
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          keyboardShouldPersistTaps="always"
        />
      ) : mentionSuggestions.length > 0 ? (
        <FlatList
          data={mentionSuggestions}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (!item.username) {
                  callbacks?.userCantBeMentionedCallback?.();
                  return;
                }
                handleMentionClick(item);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 8,
                borderRadius: 8,
                // 🎨 CUSTOMIZATION: Press feedback
                backgroundColor: pressed
                  ? theme === 'dark' ? '#404040' : '#F9FAFB'
                  : 'transparent',
                opacity: pressed ? 0.2 : 1,
              })}
            >
              <UserAvatar theme={theme} user={item} size={32} />
              <View
                style={{
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 20,
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
                      fontSize: 12,
                      lineHeight: 16,
                      fontWeight: '400',
                      // 🎨 CUSTOMIZATION: Name color
                      color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
                    }}
                  >
                    {item.name}
                  </Text>
                )}
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        />
      ) : (
        <View
          style={{
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
            }}
          >
            No users found
          </Text>
        </View>
      )}
    </View>
  );
};

export default MentionSuggestions;
