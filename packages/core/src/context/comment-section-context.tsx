import React, { createContext, ReactNode } from "react";

import {
  useCommentSectionDataInternal,
  UseCommentSectionDataProps,
  UseCommentSectionDataValues,
} from "../hooks/comments/useCommentSectionData";
import { CommentSectionInternalContext } from "../hooks/comments/useEntityComments";

export interface CommentSectionProviderProps
  extends UseCommentSectionDataProps {
  children: ReactNode;
}
export interface CommentSectionContextValues
  extends UseCommentSectionDataValues {}

export const CommentSectionContext = createContext<
  Partial<CommentSectionContextValues>
>({});

export const CommentSectionProvider: React.FC<CommentSectionProviderProps> = ({
  children,
  ...restOfProps
}: CommentSectionProviderProps) => {
  const { values, internals } = useCommentSectionDataInternal(restOfProps);

  return (
    <CommentSectionContext.Provider value={values}>
      <CommentSectionInternalContext.Provider value={internals}>
        {children}
      </CommentSectionInternalContext.Provider>
    </CommentSectionContext.Provider>
  );
};
