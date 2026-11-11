import { User } from "./User";
import { Space } from "./Space";
import { File } from "./File";

export type EventType = "online" | "physical" | "hybrid";
export type EventVisibility = "public" | "members" | "invite";
export type EventStatus = "active" | "cancelled";
export type RsvpStatus = "going" | "maybe" | "not-going";

export interface RsvpCounts {
  going: number;
  maybe: number;
  "not-going": number;
}

export interface Event {
  id: string;
  shortId: string;
  projectId: string;
  userId: string | null; // the event's owner (its creator); null after the owner's account is deleted
  user?: User | null; // Populated when include contains "user"
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  timezone: string | null;
  type: EventType;
  url: string | null;
  venueName: string | null;
  address: string | null;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  } | null;
  spaceId: string | null; // soft reference — no enforced cross-bundle FK
  space?: Space | null; // Populated when include contains "space"
  visibility: EventVisibility;
  status: EventStatus;
  allowMaybe: boolean;
  guestListVisible: boolean;
  capacity: number | null;
  hostIds: string[]; // always includes the owner
  coverImageId: string | null;
  files?: File[]; // Populated when include contains "files"
  rsvpCounts: RsvpCounts;
  userRsvp?: RsvpStatus | null; // Present with include "userRsvp" + auth
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  userId: string;
  user?: User | null; // Populated on guest-list reads
  status: RsvpStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * What cancelling an event returns: the full event, or `{ id, status }` when
 * the caller can't see the event (e.g. its owner, without active membership
 * of its space).
 */
export type CancelEventResponse = Event | { id: string; status: "cancelled" };

/**
 * What withdrawing an RSVP returns: the full event, or `{ id, userRsvp }`
 * when the caller can no longer see the event.
 */
export type WithdrawRsvpResponse = Event | { id: string; userRsvp: null };

/**
 * What removing a host returns: the full event, or `{ id }` when the caller
 * stepped down from an event they can no longer see.
 */
export type RemoveHostResponse = Event | { id: string };

export interface EventInvite {
  id: string;
  eventId: string;
  userId: string;
  user?: User | null; // Populated on invitee-list reads
  invitedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** `include` values the event fetches (single and list) accept. */
export type EventInclude = "user" | "space" | "files" | "userRsvp";
export type EventIncludeArray = EventInclude[];
export type EventIncludeParam = EventInclude | EventIncludeArray;
