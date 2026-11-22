import { SublayHttpClient } from "../../core/client";
import { User } from "../../interfaces/User";

export interface MatchUsersCommonProps {
  /** 1–50. Defaults to 20. */
  limit?: number;
  spaceId?: string;
  /** With a `spaceId`, also match users active anywhere in its subtree. */
  includeChildSpaces?: boolean;
  includeSampleContent?: boolean;
  /** Defaults to true. */
  excludeSelf?: boolean;
}

/**
 * `passive` matches on the asker's own interests and takes no `query`;
 * `directed` matches on a free-text `query`, which it requires.
 */
export type MatchUsersProps = MatchUsersCommonProps &
  (
    | { mode: "passive"; query?: never }
    | { mode: "directed"; query: string }
  );

export interface MatchFacetRef {
  id: string;
  hotness: number;
}

export interface SampleContent {
  sourceType: "entity" | "comment" | "message";
  recordId: string;
  content: string;
  similarity: number;
}

export interface MatchedFacet {
  similarity: number;
  askerFacet?: MatchFacetRef;
  candidateFacet: MatchFacetRef;
  sampleContent?: SampleContent[];
}

export interface UserMatchResult {
  user: User;
  score: number;
  matchedFacets: MatchedFacet[];
}

export interface MatchUsersResponse {
  results: UserMatchResult[];
}

export async function matchUsers(
  client: SublayHttpClient,
  data: MatchUsersProps
): Promise<MatchUsersResponse> {
  const response = await client.projectInstance.post<MatchUsersResponse>(
    "/match/users",
    data
  );
  return response.data;
}
