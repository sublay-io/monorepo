import React, { createContext, useState, useRef, useMemo, useCallback } from "react";
import { Comment as CommentType } from "@sublay/react-native";
import BottomSheet from "@gorhom/bottom-sheet";

type UIStateContext = {
  commentOptionsSheetRef: React.RefObject<BottomSheet | null>;
  reportCommentSheetRef: React.RefObject<BottomSheet | null>;
  commentOptionsSheetOwnerRef: React.RefObject<BottomSheet | null>;

  openCommentOptionsSheet: (newComment?: CommentType) => void;
  closeCommentOptionsSheet: () => void;
  openReportCommentSheet: () => void;
  closeReportCommentSheet: () => void;
  openCommentOptionsSheetOwner: (newComment?: CommentType) => void;
  closeCommentOptionsSheetOwner: () => void;

  optionsComment: CommentType | null;
  setOptionsComment: React.Dispatch<React.SetStateAction<CommentType | null>>;

  reportedComment: CommentType | null;
  setReportedComment: React.Dispatch<React.SetStateAction<CommentType | null>>;

  theme: 'light' | 'dark';
};

export const UIStateContext = createContext<Partial<UIStateContext>>(
  {}
);

export const UIStateProvider = ({
  children,
  theme = 'light',
}: {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}) => {
  const commentOptionsSheetRef = useRef<BottomSheet>(null);
  const reportCommentSheetRef = useRef<BottomSheet>(null);
  const commentOptionsSheetOwnerRef = useRef<BottomSheet>(null);

  const [optionsComment, setOptionsComment] = useState<CommentType | null>(
    null
  );
  const [reportedComment, setReportedComment] = useState<CommentType | null>(
    null
  );

  const openCommentOptionsSheet = useCallback((newComment?: CommentType) => {
    if (newComment) setOptionsComment(newComment);
    commentOptionsSheetRef.current?.snapToIndex(0);
  }, []);

  const closeCommentOptionsSheet = useCallback(() => {
    commentOptionsSheetRef.current?.close();
  }, []);

  const openReportCommentSheet = useCallback((newComment?: CommentType) => {
    if (newComment) setReportedComment(newComment);
    reportCommentSheetRef.current?.snapToIndex(0);
  }, []);

  const closeReportCommentSheet = useCallback(() => {
    reportCommentSheetRef.current?.close();
  }, []);

  const openCommentOptionsSheetOwner = useCallback((newComment?: CommentType) => {
    if (newComment) setOptionsComment(newComment);
    commentOptionsSheetOwnerRef.current?.snapToIndex(0);
  }, []);

  const closeCommentOptionsSheetOwner = useCallback(() => {
    commentOptionsSheetOwnerRef.current?.close();
  }, []);

  const contextValue = useMemo(() => ({
    commentOptionsSheetRef,
    reportCommentSheetRef,
    commentOptionsSheetOwnerRef,

    openCommentOptionsSheet,
    closeCommentOptionsSheet,
    openReportCommentSheet,
    closeReportCommentSheet,
    openCommentOptionsSheetOwner,
    closeCommentOptionsSheetOwner,

    optionsComment,
    setOptionsComment,
    reportedComment,
    setReportedComment,

    theme,
  }), [
    openCommentOptionsSheet,
    closeCommentOptionsSheet,
    openReportCommentSheet,
    closeReportCommentSheet,
    openCommentOptionsSheetOwner,
    closeCommentOptionsSheetOwner,
    optionsComment,
    reportedComment,
    theme,
  ]);

  return (
    <UIStateContext.Provider value={contextValue}>
      {children}
    </UIStateContext.Provider>
  );
};
