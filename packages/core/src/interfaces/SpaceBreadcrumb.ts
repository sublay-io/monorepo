import { SpaceVisibility } from "./models/Space";

/** A space on the path that the viewer can see. */
export interface VisibleSpaceBreadcrumbEntry {
  id: string;
  shortId: string;
  name: string;
  slug: string | null;
  avatarFileId: string | null;
  visibility: SpaceVisibility;
  parentSpaceId: string | null;
  depth: number;
  hidden: false;
}

/**
 * A space above the requested one that the viewer can't see (a private space
 * they aren't an active member of, or one under it). Carries nothing else.
 */
export interface HiddenSpaceBreadcrumbEntry {
  hidden: true;
}

export type SpaceBreadcrumbEntry =
  | VisibleSpaceBreadcrumbEntry
  | HiddenSpaceBreadcrumbEntry;

export interface SpaceBreadcrumb {
  /** The path from the top-level space down to the requested one, root first. */
  breadcrumb: SpaceBreadcrumbEntry[];
  depth: number;
}
