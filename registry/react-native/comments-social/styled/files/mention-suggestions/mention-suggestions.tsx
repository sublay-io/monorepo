import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { User } from "@sublay/react-native";
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

  if (!isMentionActive) return null;

  return (
    <View
      style={{
        height: "auto",
        maxHeight: 200,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        overflow: "hidden",
        // 🎨 CUSTOMIZATION: Mention suggestions background
        backgroundColor: theme === 'dark' ? "#262626" : "white",
        borderTopColor: theme === 'dark' ? "#525252" : "#e7e7e7",
        borderTopWidth: 1,
        padding: 14,
      }}
    >
      {isLoadingMentions ? (
        <FlatList
          data={[1, 2, 3]} // Just a placeholder array for loading skeletons
          keyExtractor={(item) => `loading-${item}`}
          renderItem={() => <UserMentionSkeleton theme={theme} />}
          keyboardShouldPersistTaps="always"
        />
      ) : (
        <FlatList
          data={mentionSuggestions}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleMentionClick(item)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 7,
              }}
            >
              <UserAvatar theme={theme} user={item} />
              <View style={{ justifyContent: "space-evenly", marginStart: 7 }}>
                <Text style={{
                  fontSize: 12.25,
                  lineHeight: 17.5,
                  fontWeight: "500",
                  // 🎨 CUSTOMIZATION: Username color
                  color: theme === 'dark' ? "#FAFAFA" : "#000",
                }}>
                  {item.username}
                </Text>
                {item.name && (
                  <Text
                    style={{
                      fontSize: 12.25,
                  lineHeight: 17.5,
                      fontWeight: "400",
                      // 🎨 CUSTOMIZATION: Name color
                      color: theme === 'dark' ? "#A3A3A3" : "gray",
                    }}
                  >
                    {item.name}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default MentionSuggestions;
