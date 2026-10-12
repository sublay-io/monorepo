import React, { createContext, useState, useRef, useMemo, useCallback } from "react";
import { Keyboard, TextInput } from "react-native";
import { Comment as CommentType } from "@sublay/react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";

type UIStateContext = {
  commentOptionsSheetRef: React.RefObject<BottomSheetMethods | null>;
  reportCommentSheetRef: React.RefObject<BottomSheetMethods | null>;
  commentOptionsSheetOwnerRef: React.RefObject<BottomSheetMethods | null>;

  // The section's main input (the comment form attaches it), and a way to
  // focus it from anywhere in the section: a comment's Reply button does.
  commentInputRef: React.RefObject<TextInput | null>;
  focusCommentInput: () => void;

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
  const commentInputRef = useRef<TextInput>(null);

  const focusCommentInput = useCallback(() => {
    const input = commentInputRef.current;
    if (!input) return;
    // Still focused with the keyboard closed (Android's back button closes
    // the keyboard without blurring): focusing again would not reopen it.
    if (input.isFocused() && !Keyboard.isVisible()) input.blur();
    input.focus();
  }, []);

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

    commentInputRef,
    focusCommentInput,

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
    focusCommentInput,
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
