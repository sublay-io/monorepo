import { resetButton, resetUl } from "~shared/react/reset-styles";
import useUIState from "../../../hooks/use-ui-state";
import strings from "../../../utils/strings";

function MainContent({ clickReport }: { clickReport: () => void }) {
  const { closeCommentOptionsModal, theme } = useUIState();
  return (
    <ul
      style={{
        ...resetUl,
        width: "100%",
      }}
    >
      <li
        style={{
          display: "flex",
          justifyContent: "center",
          justifySelf: "center",
        }}
      >
        <button
          style={{
            ...resetButton,
            fontWeight: 600,
            color: theme === 'dark' ? "#EF4444" : "#DC2626",
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 8,
            paddingBottom: 8,
          }}
          onClick={clickReport}
        >
          {strings.report}
        </button>
      </li>
      <div style={{ height: 1, width: "100%", backgroundColor: theme === 'dark' ? "#525252" : "#e7e7e7" }} />
      <li
        style={{
          display: "flex",
          justifyContent: "center",
          justifySelf: "center",
        }}
      >
        <button
          style={{
            ...resetButton,
            color: theme === 'dark' ? "#D4D4D4" : "#374151", // 🎨 CUSTOMIZATION: Cancel button text color
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 8,
            paddingBottom: 8,
          }}
          onClick={closeCommentOptionsModal}
        >
          {strings.cancel}
        </button>
      </li>
    </ul>
  );
}

export default MainContent;
