import { resetUl } from "~shared/react/reset-styles";
import useUIState from "../../../hooks/use-ui-state";
import strings from "../../../utils/strings";

function MainContent({ clickReport }: { clickReport: () => void }) {
  const {
    closeCommentMenuModal
  } = useUIState();

  return (
    <ul
      style={resetUl}
      className="w-full"
    >
      <li className="flex justify-center justify-self-center">
        <button
          className="font-semibold text-red-600 dark:text-red-400 px-6 py-2 bg-transparent border-none outline-none cursor-pointer"
          onClick={clickReport}
        >
          {strings.report}
        </button>
      </li>
      <div className="h-px w-full bg-gray-200 dark:bg-neutral-600" />
      <li className="flex justify-center justify-self-center">
        <button
          className="text-gray-900 dark:text-neutral-50 px-6 py-2 bg-transparent border-none outline-none cursor-pointer"
          onClick={closeCommentMenuModal}
        >
          {strings.cancel}
        </button>
      </li>
    </ul>
  );
}

export default MainContent;
