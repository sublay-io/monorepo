function NoCommentsPlaceHolder() {
  return (
    <div>
      <p
        className="text-center text-lg font-bold text-gray-800 dark:text-neutral-200 mb-2"
        // 🎨 CUSTOMIZATION: No comments title styling
      >
        No comments yet
      </p>
      <p
        className="text-center text-xs text-gray-500 dark:text-neutral-400 mt-0"
        // 🎨 CUSTOMIZATION: No comments subtitle styling
      >
        Start the conversation.
      </p>
    </div>
  );
}

export default NoCommentsPlaceHolder;
