// Type-level checks for the useFetchWorkspaceMembers overloads. `expectTypeOf`
// is a no-op at runtime; core's `tsc` typecheck (which includes test files)
// fails if the overloads stop resolving as asserted here.
import { describe, it, expectTypeOf } from "vitest";

import type { FetchWorkspaceMembers } from "./useFetchWorkspaceMembers";
import type {
  WorkspaceRosterEntry,
  WorkspaceRosterCountsResponse,
} from "../../interfaces/models/Workspace";

// A runtime stub so the calls below execute; only their static types matter.
const fetchWorkspaceMembers = (() =>
  Promise.resolve([])) as unknown as FetchWorkspaceMembers;
const runtimeFlag: boolean = Date.now() < 0;

describe("useFetchWorkspaceMembers types", () => {
  it("a call without countOnly resolves to the roster array", () => {
    expectTypeOf(
      fetchWorkspaceMembers({ workspaceId: "w1" })
    ).toEqualTypeOf<Promise<WorkspaceRosterEntry[]>>();
    expectTypeOf(
      fetchWorkspaceMembers({ workspaceId: "w1", include: "descendants" })
    ).toEqualTypeOf<Promise<WorkspaceRosterEntry[]>>();
  });

  it("countOnly: false resolves to the roster array", () => {
    expectTypeOf(
      fetchWorkspaceMembers({ workspaceId: "w1", countOnly: false })
    ).toEqualTypeOf<Promise<WorkspaceRosterEntry[]>>();
  });

  it("countOnly: true resolves to the counts", () => {
    expectTypeOf(
      fetchWorkspaceMembers({ workspaceId: "w1", countOnly: true })
    ).toEqualTypeOf<Promise<WorkspaceRosterCountsResponse>>();
  });

  it("a runtime boolean resolves to the union", () => {
    expectTypeOf(
      fetchWorkspaceMembers({ workspaceId: "w1", countOnly: runtimeFlag })
    ).toEqualTypeOf<
      Promise<WorkspaceRosterEntry[] | WorkspaceRosterCountsResponse>
    >();
  });

  it("the plain call's result can be iterated without narrowing", async () => {
    const roster = await fetchWorkspaceMembers({ workspaceId: "w1" });
    expectTypeOf(roster.forEach).toBeFunction();
  });
});
