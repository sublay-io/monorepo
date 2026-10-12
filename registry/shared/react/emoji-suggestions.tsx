import { useEffect, useState } from "react";
import { type UITheme, uiColor } from "./theme";

const emojiGroup1 = ["😂", "❤️", "🤣", "😍", "🙏"];
const emojiGroup2 = ["🥰", "😊", "😭", "👍", "😅"];
const emojiGroup3 = ["😢", "👏", "💕", "🥺", "😘"];
const emojiGroup4 = ["🤔", "🤗", "🙌", "😎", "✨"];


function EmojiSuggestions({
  onEmojiClick,
  theme = "light",
}: {
  onEmojiClick: (emoji: string) => void;
  theme?: UITheme; // Colors to draw with (default: light)
}) {
  const [clickedEmoji, setClickedEmoji] = useState<string | null>(null);
  const [emojiSubset, setEmojiSubset] = useState<string[]>([]);

  useEffect(() => {
    // Pick 8 random emojis from the array
    const combinedEmojis = [...emojiGroup1, ...emojiGroup2, ...emojiGroup3];

    const shuffled = combinedEmojis.sort(() => 0.5 - Math.random());
    setEmojiSubset(shuffled.slice(0, 8));
  }, []);

  const handleEmojiClick = (emoji: string) => {
    setClickedEmoji(emoji);
    onEmojiClick(emoji);
    setTimeout(() => setClickedEmoji(null), 150); // Reset after animation
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: 8,
        borderBottom: `1px solid ${uiColor("divider", theme)}`,
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {emojiSubset.map((emoji) => (
        <div
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          style={{
            cursor: "pointer",
            fontSize: 16,
            display: "inline-block",
            userSelect: "none",
            transition: "transform 0.15s",
            transform: clickedEmoji === emoji ? "scale(0.8)" : "scale(1)", // Shrink and grow
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}

export default EmojiSuggestions;
