import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

function NoCommentsPlaceHolder() {
  const { theme } = useUIState();

  return (
    <div>
      <p
        style={{
          textAlign: "center",
          fontSize: 18,
          fontWeight: 700,
          color: theme === 'dark' ? "#E5E5E5" : "#1F2937", // 🎨 CUSTOMIZATION: No comments title color
          marginBottom: 8,
        }}
      >
        {strings.noCommentsTitle}
      </p>
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: theme === 'dark' ? "#A3A3A3" : "#8e8e8e",
          marginTop: 0,
        }}
      >
        {strings.noCommentsSubtitle}
      </p>
    </div>
  );
}

export default NoCommentsPlaceHolder;
