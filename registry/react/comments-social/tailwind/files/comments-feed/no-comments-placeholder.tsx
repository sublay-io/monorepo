function NoCommentsPlaceHolder() {
  return (
    <div
      className="p-4 h-full flex flex-col justify-center"
    >
      <p
        className="text-center text-lg font-bold mb-2 text-gray-900 dark:text-neutral-50"
      >
        No comments yet
      </p>
      <p
        className="text-center text-xs text-gray-500 dark:text-neutral-400 mt-0"
      >
        Start the conversation.
      </p>
    </div>
  );
}

export default NoCommentsPlaceHolder;
