import { useContext } from "react";
import { SpaceContext } from "../../context/space-context";
import { UseSpaceDataValues } from "./useSpaceData";
import { SublayError } from "../../errors/SublayError";

const useSpace = (): UseSpaceDataValues => {
  const context = useContext(SpaceContext);

  if (!context) {
    throw new SublayError("useSpace must be used within a SpaceProvider");
  }

  return context as UseSpaceDataValues;
};

export default useSpace;
