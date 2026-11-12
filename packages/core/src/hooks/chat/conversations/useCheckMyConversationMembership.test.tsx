import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../../test-utils";
import useCheckMyConversationMembership from "./useCheckMyConversationMembership";
import type { CheckMyConversationMembershipResponse } from "../../../interfaces/models/ConversationMember";

afterEach(() => {
  resetAxiosMocks();
});

describe("useCheckMyConversationMembership", () => {
  it("gets /chat/conversations/:conversationId/members/me and returns the body as-is", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useCheckMyConversationMembership(),
    );

    const body: CheckMyConversationMembershipResponse = {
      isMember: true,
      role: "admin",
      lastReadAt: "2026-11-01T00:00:00.000Z",
      mutedForever: false,
      mutedUntil: null,
    };
    axiosPrivate.mockResponse("get", body);

    let returned: CheckMyConversationMembershipResponse | undefined;
    await act(async () => {
      returned = await result.current({ conversationId: "conv-1" });
    });

    expect(returned).toEqual(body);
    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/chat/conversations/conv-1/members/me");
    // The member is the token's user: no actingUserId is ever sent.
    expect(call.config).toBeUndefined();
  });

  it("passes a former member's answer through without adding fields", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useCheckMyConversationMembership(),
    );

    axiosPrivate.mockResponse("get", {
      isMember: false,
      leftAt: "2026-11-02T00:00:00.000Z",
    });

    let returned: CheckMyConversationMembershipResponse | undefined;
    await act(async () => {
      returned = await result.current({ conversationId: "conv-1" });
    });

    expect(returned).toEqual({
      isMember: false,
      leftAt: "2026-11-02T00:00:00.000Z",
    });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useCheckMyConversationMembership(),
    );

    axiosPrivate.mockError("get", 403, { code: "chat/not-a-member" });

    await expect(
      result.current({ conversationId: "conv-1" }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("throws before requesting when conversationId is missing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useCheckMyConversationMembership(),
    );

    await expect(result.current({ conversationId: "" })).rejects.toThrow(
      "Please pass a conversationId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});
