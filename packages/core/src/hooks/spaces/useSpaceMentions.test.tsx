import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeSpace } from "../../test-utils";
import useSpaceMentions, { type UseSpaceMentionsProps } from "./useSpaceMentions";

afterEach(() => {
  resetAxiosMocks();
});

// Real timers throughout — see hooks/users/useUserMentions.test.tsx for why
// fake timers are avoided here.

describe("useSpaceMentions", () => {
  it("activates mention state and fetches suggestions after the debounce delay", async () => {
    const setContent = vi.fn();
    const focus = vi.fn();

    const { result, axiosPrivate } = renderHookWithAxios(
      (props: UseSpaceMentionsProps) => useSpaceMentions(props),
      {
        initialProps: {
          content: "hello #des",
          setContent,
          focus,
          cursorPosition: 10,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    expect(result.current.isSpaceMentionActive).toBe(true);

    const suggestions = [makeSpace({ slug: "design" }), makeSpace({ id: "space-2", slug: "design-systems" })];
    axiosPrivate.mockResponse("get", { data: suggestions, pagination: { page: 1, pageSize: 5, totalPages: 1, totalItems: 2, hasMore: false } });

    await waitFor(() => expect(result.current.spaceMentionSuggestions).toEqual(suggestions));

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({ query: "des", limit: 5 });

    act(() => {
      result.current.handleSpaceMentionClick(suggestions[0]);
    });

    expect(setContent).toHaveBeenCalledWith("hello #design ");
    expect(focus).toHaveBeenCalledTimes(1);
    expect(result.current.mentions).toEqual([
      { id: "space-1", slug: "design", type: "space" },
    ]);
    expect(result.current.isSpaceMentionActive).toBe(false);
  });

  it("stays closed after a suggestion is picked, until the user types or moves the cursor", async () => {
    const base = {
      setContent: vi.fn(),
      focus: vi.fn(),
      isSelectionActive: false,
      debounceDelay: 10,
    };

    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseSpaceMentionsProps) => useSpaceMentions(props),
      { initialProps: { ...base, content: "hello #des", cursorPosition: 10 } },
    );

    const suggestions = [makeSpace({ slug: "design" })];
    axiosPrivate.mockResponse("get", { data: suggestions, pagination: { page: 1, pageSize: 5, totalPages: 1, totalItems: 1, hasMore: false } });
    await waitFor(() => expect(result.current.spaceMentionSuggestions).toEqual(suggestions));

    act(() => {
      result.current.handleSpaceMentionClick(suggestions[0]);
    });
    expect(result.current.isSpaceMentionActive).toBe(false);

    // The caller applies the new text. Its cursor position is still the old
    // one (the text changed without an input event), so the word before the
    // cursor reads "#des" again.
    rerender({ ...base, content: "hello #design ", cursorPosition: 10 });
    expect(result.current.isSpaceMentionActive).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(result.current.isSpaceMentionActive).toBe(false);
    expect(axiosPrivate.calls("get")).toHaveLength(1);

    // The user goes on typing a second mention: detection is back.
    rerender({ ...base, content: "hello #design #mus", cursorPosition: 18 });
    expect(result.current.isSpaceMentionActive).toBe(true);
  });

  it("opens for a slug in another script", () => {
    const { result } = renderHookWithAxios(
      (props: UseSpaceMentionsProps) => useSpaceMentions(props),
      {
        initialProps: {
          content: "ראו #עיצוב",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 10,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    expect(result.current.isSpaceMentionActive).toBe(true);
  });

  it("activates for a trigger at the start of a new line", () => {
    const { result } = renderHookWithAxios(
      (props: UseSpaceMentionsProps) => useSpaceMentions(props),
      {
        initialProps: {
          content: "hello\n#des",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 10,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    expect(result.current.isSpaceMentionActive).toBe(true);
  });

  it("does not activate mention state when there is no trigger before the cursor", () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      (props: UseSpaceMentionsProps) => useSpaceMentions(props),
      {
        initialProps: {
          content: "hello world",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 11,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    expect(result.current.isSpaceMentionActive).toBe(false);
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("addSpaceMention is idempotent for the same space ID and throws for a slugless space", () => {
    const { result } = renderHookWithAxios(
      (props: UseSpaceMentionsProps) => useSpaceMentions(props),
      {
        initialProps: {
          content: "",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 0,
          isSelectionActive: false,
        },
      },
    );

    const design = makeSpace({ slug: "design" });

    act(() => {
      result.current.addSpaceMention(design);
      result.current.addSpaceMention(design);
    });
    expect(result.current.mentions).toHaveLength(1);

    expect(() => result.current.addSpaceMention(makeSpace({ slug: null }))).toThrow(
      "Space has no slug set",
    );
  });

  it("resetSpaceMentions clears all mention state", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      (props: UseSpaceMentionsProps) => useSpaceMentions(props),
      {
        initialProps: {
          content: "hello #des",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 10,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    axiosPrivate.mockResponse("get", { data: [makeSpace()], pagination: { page: 1, pageSize: 5, totalPages: 1, totalItems: 1, hasMore: false } });
    await waitFor(() => expect(result.current.spaceMentionSuggestions).toHaveLength(1));

    act(() => {
      result.current.resetSpaceMentions();
    });

    expect(result.current.isSpaceMentionActive).toBe(false);
    expect(result.current.spaceMentionSuggestions).toEqual([]);
  });
});
