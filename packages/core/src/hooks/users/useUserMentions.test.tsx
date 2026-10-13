import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeUser } from "../../test-utils";
import useUserMentions, { type UseUserMentionsProps } from "./useUserMentions";

afterEach(() => {
  resetAxiosMocks();
});

// Real timers throughout — fake timers are known to corrupt React's scheduler
// for hooks that combine debounced effects with state updates. A short
// `debounceDelay` keeps these tests fast without needing to fake the clock.

describe("useUserMentions", () => {
  it("activates mention state and fetches suggestions after the debounce delay", async () => {
    const setContent = vi.fn();
    const focus = vi.fn();

    const { result, axiosPrivate } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
      {
        initialProps: {
          content: "hello @ali",
          setContent,
          focus,
          cursorPosition: 10,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    expect(result.current.isMentionActive).toBe(true);
    expect(result.current.loading).toBe(true);

    const suggestions = [makeUser({ username: "alice" }), makeUser({ id: "user-2", username: "alicia" })];
    axiosPrivate.mockResponse("get", suggestions);

    await waitFor(() => expect(result.current.mentionSuggestions).toEqual(suggestions));
    expect(result.current.loading).toBe(false);

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({ query: "ali" });

    act(() => {
      result.current.handleMentionClick(suggestions[0]);
    });

    expect(setContent).toHaveBeenCalledWith("hello @alice ");
    expect(focus).toHaveBeenCalledTimes(1);
    expect(result.current.mentions).toEqual([
      { id: "user-1", foreignId: null, username: "alice", type: "user" },
    ]);
    expect(result.current.isMentionActive).toBe(false);
    expect(result.current.mentionSuggestions).toEqual([]);
  });

  it("stays closed after a suggestion is picked, until the user types or moves the cursor", async () => {
    const base = {
      setContent: vi.fn(),
      focus: vi.fn(),
      isSelectionActive: false,
      debounceDelay: 10,
    };

    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
      { initialProps: { ...base, content: "hello @ali", cursorPosition: 10 } },
    );

    const suggestions = [makeUser({ username: "alice" })];
    axiosPrivate.mockResponse("get", suggestions);
    await waitFor(() => expect(result.current.mentionSuggestions).toEqual(suggestions));

    act(() => {
      result.current.handleMentionClick(suggestions[0]);
    });
    expect(result.current.isMentionActive).toBe(false);

    // The caller applies the new text. Its cursor position is still the old
    // one (the text changed without an input event), so the word before the
    // cursor reads "@ali" again.
    rerender({ ...base, content: "hello @alice ", cursorPosition: 10 });
    expect(result.current.isMentionActive).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(result.current.isMentionActive).toBe(false);
    expect(axiosPrivate.calls("get")).toHaveLength(1);

    // The user goes on typing a second mention: detection is back.
    rerender({ ...base, content: "hello @alice @bob", cursorPosition: 17 });
    expect(result.current.isMentionActive).toBe(true);
  });

  it("keeps the suggestions open across a hyphen in the name being typed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
      {
        initialProps: {
          content: "hi @fat-bro",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 11,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    expect(result.current.isMentionActive).toBe(true);
    axiosPrivate.mockResponse("get", [makeUser({ username: "fat-brown-damselfly" })]);
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));
    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({ query: "fat-bro" });
  });

  it.each([
    ["Hebrew", "@דניאל"],
    ["accented Latin", "@josé"],
    ["Chinese", "@张伟明"],
    ["Cyrillic", "@имя"],
  ])("opens for a %s name and looks it up", async (_label, typed) => {
    const content = `hi ${typed}`;
    const { result, axiosPrivate } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
      {
        initialProps: {
          content,
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: content.length,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    expect(result.current.isMentionActive).toBe(true);
    axiosPrivate.mockResponse("get", []);
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));
    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({ query: typed.slice(1) });
  });

  it("closes at a dot, which a username cannot contain", () => {
    const { result } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
      {
        initialProps: {
          content: "thanks @alice.",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 14,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    expect(result.current.isMentionActive).toBe(false);
  });

  it("activates for a trigger at the start of a new line", () => {
    const { result } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
      {
        initialProps: {
          content: "hello\n@ali",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 10,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    expect(result.current.isMentionActive).toBe(true);
  });

  it("does not activate mention state when there is no trigger before the cursor", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
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

    expect(result.current.isMentionActive).toBe(false);
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("does not activate mention state while a text selection is active", () => {
    const { result } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
      {
        initialProps: {
          content: "hello @ali",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 10,
          isSelectionActive: true,
          debounceDelay: 10,
        },
      },
    );

    expect(result.current.isMentionActive).toBe(false);
  });

  it("addMention is idempotent for the same user ID and throws for a usernameless user", () => {
    const { result } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
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

    const alice = makeUser({ username: "alice" });

    act(() => {
      result.current.addMention(alice);
      result.current.addMention(alice);
    });
    expect(result.current.mentions).toHaveLength(1);

    expect(() => result.current.addMention(makeUser({ username: null }))).toThrow(
      "User has no username set",
    );
  });

  it("setMentions puts a saved mentions list back after a reset", () => {
    const { result } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
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

    act(() => {
      result.current.addMention(makeUser({ id: "user-a", username: "alice" }));
      result.current.addMention(makeUser({ id: "user-b", username: "bob" }));
    });
    const saved = result.current.mentions;
    expect(saved).toHaveLength(2);

    act(() => result.current.resetMentions());
    expect(result.current.mentions).toEqual([]);

    act(() => result.current.setMentions(saved));
    expect(result.current.mentions).toEqual(saved);
  });

  it("resetMentions clears all mention state", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
      {
        initialProps: {
          content: "hello @ali",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 10,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    axiosPrivate.mockResponse("get", [makeUser({ username: "alice" })]);
    await waitFor(() => expect(result.current.mentionSuggestions).toHaveLength(1));

    act(() => {
      result.current.resetMentions();
    });

    expect(result.current.isMentionActive).toBe(false);
    expect(result.current.mentionSuggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("swallows a debounced fetch failure without throwing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      (props: UseUserMentionsProps) => useUserMentions(props),
      {
        initialProps: {
          content: "hello @ali",
          setContent: vi.fn(),
          focus: vi.fn(),
          cursorPosition: 10,
          isSelectionActive: false,
          debounceDelay: 10,
        },
      },
    );

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.mentionSuggestions).toEqual([]);
  });
});
