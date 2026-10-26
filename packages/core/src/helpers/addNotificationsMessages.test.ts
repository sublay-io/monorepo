import { describe, it, expect } from "vitest";

import addNotificationsMessages from "./addNotificationsMessages";
import type { PotentiallyPopulatedUnifiedAppNotification } from "../interfaces/models/AppNotification";

const base = {
  id: "n1",
  userId: "u1",
  isRead: false,
  createdAt: "2026-10-26T00:00:00.000Z",
};

const initiator = {
  initiatorId: "i1",
  initiatorName: "Dana",
  initiatorUsername: "dana",
  initiatorAvatar: null,
};

const one = (n: PotentiallyPopulatedUnifiedAppNotification) =>
  addNotificationsMessages([n])[0];

describe("addNotificationsMessages — event and reputation-grant notifications", () => {
  it("event-invite: default title names the inviter and the event", () => {
    const n = one({
      ...base,
      type: "event-invite",
      action: "open-event",
      metadata: { eventId: "e1", eventTitle: "Launch party", eventStartTime: null, ...initiator },
    });
    expect(n.title).toBe("dana invited you to Launch party");
    expect(n.content).toBe("");
  });

  it("event-updated and event-cancelled: default titles name the event", () => {
    const updated = one({
      ...base,
      type: "event-updated",
      action: "open-event",
      metadata: { eventId: "e1", eventTitle: "Launch party", changedFields: ["time"], ...initiator },
    });
    const cancelled = one({
      ...base,
      type: "event-cancelled",
      action: "open-event",
      metadata: { eventId: "e1", eventTitle: "Launch party", ...initiator },
    });
    expect(updated.title).toBe("Launch party was updated");
    expect(cancelled.title).toBe("Launch party was cancelled");
  });

  it("reputation-grant: default title carries the amount, content the note", () => {
    const n = one({
      ...base,
      type: "reputation-grant",
      action: "open-profile",
      metadata: {
        grantId: "g1",
        amount: 50,
        sourceType: "user",
        note: "Great answer",
        granterId: "i1",
        granterName: "Dana",
        granterUsername: "dana",
      },
    });
    expect(n.title).toBe("You received 50 reputation");
    expect(n.content).toBe("Great answer");
  });

  it("reputation-grant from the app: no granter, and a custom template can use the vars", () => {
    const [n] = addNotificationsMessages(
      [
        {
          ...base,
          type: "reputation-grant",
          action: "do-nothing",
          metadata: { grantId: "g2", amount: 10, sourceType: "app" },
        },
      ],
      {
        reputationGrant: {
          title: (v) => `+${v.amount} from ${v.granterUsername || "the team"}`,
        },
      },
    );
    expect(n.title).toBe("+10 from the team");
    expect(n.content).toBe("");
  });

  it("a custom event template overrides the default", () => {
    const [n] = addNotificationsMessages(
      [
        {
          ...base,
          type: "event-cancelled",
          action: "open-event",
          metadata: { eventId: "e1", eventTitle: "Launch party", ...initiator },
        },
      ],
      { eventCancelled: { title: "Cancelled: $eventTitle" } },
    );
    expect(n.title).toBe("Cancelled: Launch party");
  });
});
