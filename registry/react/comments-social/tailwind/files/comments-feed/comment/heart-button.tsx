import HeartFullIcon from "~shared/react/heart-full-icon";
import HeartIcon from "~shared/react/heart-icon";
import { resetButton } from "~shared/react/reset-styles";

const HeartButton = ({
  userUpvoted,
  handleUpvote,
  handleRemoveUpvote,
  iconSize,
  fullColor,
  emptyColor,
  padding = 0,
  paddingBottom = 0,
}: {
  userUpvoted: boolean;
  handleUpvote: () => void;
  handleRemoveUpvote: () => void;
  iconSize?: number;
  fullColor?: string;
  emptyColor?: string;
  padding?: number;
  paddingBottom?: number;
}) => {
  return userUpvoted ? (
    <div
      onClick={handleRemoveUpvote}
      style={{
        padding,
        paddingBottom,
        ...resetButton,
      }}
      className="flex items-center justify-center"
    >
      <HeartFullIcon size={iconSize} color={fullColor} />
    </div>
  ) : (
    <div
      onClick={handleUpvote}
      style={{
        padding,
        paddingBottom,
        ...resetButton,
      }}
      className="flex items-center justify-center"
    >
      <HeartIcon size={iconSize} color={emptyColor} />
    </div>
  );
};

export default HeartButton;
