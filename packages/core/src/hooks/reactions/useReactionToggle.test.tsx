import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import useReactionToggle from "./useReactionToggle";

afterEach(() => {
  resetAxiosMocks();
});

describe("useReactionToggle", () => {
  it("adds a reaction when there is no current reaction", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useReactionToggle({ targetType: "entity", targetId: "entity-1" }),
    );

    const updated = makeEntity({
      userReaction: "upvote",
      reactionCounts: { upvote: 1, downvote: 0, like: 0, love: 0, wow: 0, sad: 0, angry: 0, funny: 0 },
    });
    axiosPrivate.mockResponse("post", updated);

    await act(async () => {
      await result.current.toggleReaction({ reactionType: "upvote" });
    });

    expect(result.current.currentReaction).toBe("upvote");
    expect(result.current.reactionCounts).toEqual(updated.reactionCounts);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/entities/entity-1/reactions");
    expect(call.body).toEqual({ reactionType: "upvote" });
  });

  it("removes the reaction when toggling the same type again", async () => {
    const initialReactionCounts = {
      upvote: 1, downvote: 0, like: 0, love: 0, wow: 0, sad: 0, angry: 0, funny: 0,
    };
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useReactionToggle({
        targetType: "entity",
        targetId: "entity-1",
        initialReaction: "upvote",
        initialReactionCounts,
      }),
    );

    const updated = makeEntity({
      userReaction: null,
      reactionCounts: { upvote: 0, downvote: 0, like: 0, love: 0, wow: 0, sad: 0, angry: 0, funny: 0 },
    });
    axiosPrivate.mockResponse("delete", updated);

    await act(async () => {
      await result.current.toggleReaction({ reactionType: "upvote" });
    });

    expect(result.current.currentReaction).toBeNull();
    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/entities/entity-1/reactions");
  });

  it("switches from one reaction type to another in a single call", async () => {
    const initialReactionCounts = {
      upvote: 1, downvote: 0, like: 0, love: 0, wow: 0, sad: 0, angry: 0, funny: 0,
    };
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useReactionToggle({
        targetType: "entity",
        targetId: "entity-1",
        initialReaction: "upvote",
        initialReactionCounts,
      }),
    );

    const updated = makeEntity({
      userReaction: "love",
      reactionCounts: { upvote: 0, downvote: 0, like: 0, love: 1, wow: 0, sad: 0, angry: 0, funny: 0 },
    });
    axiosPrivate.mockResponse("post", updated);

    await act(async () => {
      await result.current.toggleReaction({ reactionType: "love" });
    });

    expect(result.current.currentReaction).toBe("love");
    expect(result.current.reactionCounts).toEqual(updated.reactionCounts);

    const [call] = axiosPrivate.calls("post");
    expect(call.body).toEqual({ reactionType: "love" });
  });

  it("reverts the optimistic update when the request fails", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useReactionToggle({ targetType: "entity", targetId: "entity-1" }),
    );

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    let returned;
    await act(async () => {
      returned = await result.current.toggleReaction({ reactionType: "upvote" });
    });

    expect(returned).toBeNull();
    expect(result.current.currentReaction).toBeNull();
    expect(result.current.reactionCounts).toEqual({});
  });

  it("returns null without calling the API when there is no target ID", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useReactionToggle({ targetType: "entity", targetId: undefined }),
    );

    let returned;
    await act(async () => {
      returned = await result.current.toggleReaction({ reactionType: "upvote" });
    });

    expect(returned).toBeNull();
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  // REGRESSION (#233): an inline `initialReactionCounts` is a fresh reference
  // every render. Held raw in the reset effect's deps, any re-render reset
  // state, which re-rendered, which reset again: an endless loop. (Mount alone
  // didn't loop: the first reset sets the same object the state started with.)
  const counts = (upvote: number) => ({
    upvote, downvote: 0, like: 0, love: 0, wow: 0, sad: 0, angry: 0, funny: 0,
  });

  it("does not loop when re-rendered with an inline initialReactionCounts", async () => {
    let renders = 0;
    const { result, rerender } = renderHookWithAxios(() => {
      renders += 1;
      // The old code looped synchronously; fail instead of hanging.
      if (renders > 50) throw new Error("render loop");
      return useReactionToggle({
        targetType: "entity",
        targetId: "entity-1",
        initialReactionCounts: counts(3),
      });
    });

    for (let i = 0; i < 3; i += 1) rerender();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(renders).toBeLessThan(10);
    expect(result.current.reactionCounts).toEqual(counts(3));
  });

  it("still resets when initialReactionCounts really changes", async () => {
    let renders = 0;
    const { result, rerender } = renderHookWithAxios(
      (props: { upvotes: number }) => {
        renders += 1;
        // The old code looped synchronously; fail instead of hanging.
        if (renders > 50) throw new Error("render loop");
        return useReactionToggle({
          targetType: "entity",
          targetId: "entity-1",
          initialReactionCounts: counts(props.upvotes),
        });
      },
      { initialProps: { upvotes: 3 } },
    );

    rerender({ upvotes: 4 });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.reactionCounts).toEqual(counts(4));
  });

  // The case #233 calls realistic: a re-render with the same inline counts used
  // to reset state, wiping the counts the toggle had just set.
  it("keeps the counts from a toggle when re-rendered with equal inline initialReactionCounts", async () => {
    let renders = 0;
    const { result, rerender, axiosPrivate } = renderHookWithAxios(() => {
      renders += 1;
      if (renders > 50) throw new Error("render loop");
      return useReactionToggle({
        targetType: "entity",
        targetId: "entity-1",
        initialReactionCounts: counts(3),
      });
    });

    axiosPrivate.mockResponse("post", makeEntity({ userReaction: "upvote", reactionCounts: counts(4) }));
    await act(async () => {
      await result.current.toggleReaction({ reactionType: "upvote" });
    });

    rerender();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.reactionCounts).toEqual(counts(4));
    expect(result.current.currentReaction).toBe("upvote");
  });
});
