import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

function NoCommentsPlaceHolder() {
  const { theme } = useUIState();

  return (
    <div
      style={{
        padding: 16,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <p
        style={{
          textAlign: "center",
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
          // 🎨 CUSTOMIZATION: Title text color
          color: theme === 'dark' ? '#FAFAFA' : '#000',
        }}
      >
        {strings.noCommentsTitle}
      </p>
      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          // 🎨 CUSTOMIZATION: Subtitle text color
          color: theme === 'dark' ? '#A3A3A3' : '#8e8e8e',
          marginTop: 0,
        }}
      >
        {strings.noCommentsSubtitle}
      </p>
    </div>
  );
}

export default NoCommentsPlaceHolder;
