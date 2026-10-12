import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { type UITheme, uiColors } from "./theme";

const emojiGroup1 = ["😂", "❤️", "🤣", "😍", "🙏"];
const emojiGroup2 = ["🥰", "😊", "😭", "👍", "😅"];
const emojiGroup3 = ["😢", "👏", "💕", "🥺", "😘"];
const emojiGroup4 = ["🤔", "🤗", "🙌", "😎", "✨"];

interface EmojiSuggestionsProps {
  onEmojiClick: (emoji: string) => void;
  theme?: UITheme; // colors to draw with (default: light)
}

const EmojiSuggestions: React.FC<EmojiSuggestionsProps> = ({
  onEmojiClick,
  theme = "light",
}) => {
  const [clickedEmoji, setClickedEmoji] = useState<string | null>(null);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [emojiSubset, setEmojiSubset] = useState<string[]>([]);

  useEffect(() => {
    // Pick 8 random emojis from the array
    const combinedEmojis = [...emojiGroup1, ...emojiGroup2, ...emojiGroup3];

    const shuffled = combinedEmojis.sort(() => 0.5 - Math.random());
    setEmojiSubset(shuffled.slice(0, 8));
  }, []);

  const handleEmojiClick = (emoji: string) => {
    setClickedEmoji(emoji);

    // Shrink animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setClickedEmoji(null);
    });

    onEmojiClick(emoji);
  };

  return (
    <View
      style={{
        borderBottomWidth: 0.5,
        borderBottomColor: uiColors[theme].divider,
        padding: 8,
        flexDirection: "row",
        justifyContent: "space-around", // Distribute emojis evenly
        alignItems: "center",
      }}
    >
      {emojiSubset.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          onPress={() => handleEmojiClick(emoji)}
          activeOpacity={0.7}
        >
          <Animated.View
            style={{
              transform: [
                {
                  scale: clickedEmoji === emoji ? scaleAnim : 1,
                },
              ],
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 24,
              }}
            >
              {emoji}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default EmojiSuggestions;
