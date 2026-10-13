import useUIState from "../../../hooks/use-ui-state";
import strings from "../../../utils/strings";

function MainContent({ clickReport }: { clickReport: () => void }) {
  const { closeCommentOptionsModal } = useUIState();
  return (
    <ul className="w-full list-none m-0 p-0">
      <li className="flex justify-center justify-self-center">
        <button
          className="font-semibold text-red-600 dark:text-red-500 px-6 py-2 bg-transparent border-none cursor-pointer"
          // 🎨 CUSTOMIZATION: Report button styling
          onClick={clickReport}
        >
          {strings.report}
        </button>
      </li>
      <div className="h-px w-full bg-gray-200 dark:bg-neutral-600" />
      <li className="flex justify-center justify-self-center">
        <button
          className="text-gray-700 dark:text-neutral-300 px-6 py-2 bg-transparent border-none cursor-pointer"
          // 🎨 CUSTOMIZATION: Cancel button styling
          onClick={closeCommentOptionsModal}
        >
          {strings.cancel}
        </button>
      </li>
    </ul>
  );
}

export default MainContent;
