import {
  addMember,
  approveMembership,
  banMember,
  checkMyMembership,
  declineMembership,
  fetchSpaceMembers,
  fetchSpaceTeam,
  joinSpace,
  leaveSpace,
  unbanMember,
  updateMemberRole,
} from "../src/modules/spaces";
import { makeClient } from "./helpers/client";

// What the member actions answer with: the membership record itself.
function membershipRecord(status: string, role: string) {
  return {
    id: "m1",
    spaceId: "s1",
    userId: "u-target",
    role,
    status,
    joinedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("js-sdk spaces (membership) — request shaping", () => {
  it("joinSpace posts /spaces/:spaceId/join with no body (no userId — actor derived from token)", async () => {
    const { client, projectInstance } = makeClient();
    await joinSpace(client, { spaceId: "s1" });
    expect(projectInstance.post).toHaveBeenCalledWith("/spaces/s1/join");
    expect(projectInstance.post.mock.calls[0]).toHaveLength(1);
  });

  it("leaveSpace deletes /spaces/:spaceId/members/me with no body/params (no userId — actor derived from token)", async () => {
    const { client, projectInstance } = makeClient();
    await leaveSpace(client, { spaceId: "s1" });
    expect(projectInstance.delete).toHaveBeenCalledWith("/spaces/s1/members/me");
    expect(projectInstance.delete.mock.calls[0]).toHaveLength(1);
  });

  it("checkMyMembership gets /spaces/:spaceId/members/me with no params (no userId — actor derived from token)", async () => {
    const { client, projectInstance } = makeClient();
    await checkMyMembership(client, { spaceId: "s1" });
    expect(projectInstance.get).toHaveBeenCalledWith(
      "/spaces/s1/members/me"
    );
    expect(projectInstance.get.mock.calls[0]).toHaveLength(1);
  });

  it("fetchSpaceMembers strips spaceId into the path and passes the rest as params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchSpaceMembers(client, { spaceId: "s1", role: "admin", page: 1 });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/members", {
      params: { role: "admin", page: 1 },
    });
  });

  it("fetchSpaceMembers forwards spaceReputation params alongside role/status", async () => {
    const { client, projectInstance } = makeClient();
    await fetchSpaceMembers(client, {
      spaceId: "s1",
      status: "active",
      spaceReputation: { spaceId: "s1", includeDescendants: true },
    });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/members", {
      params: {
        status: "active",
        spaceReputationId: "s1",
        spaceReputationDescendants: true,
      },
    });
  });

  it("fetchSpaceTeam strips spaceId into the path and passes the rest as params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchSpaceTeam(client, { spaceId: "s1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/team", {
      params: {},
    });
  });

  it("fetchSpaceTeam forwards spaceReputation params as the rest of params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchSpaceTeam(client, {
      spaceId: "s1",
      spaceReputation: { spaceId: "context" },
    });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/team", {
      params: { spaceReputationId: "context" },
    });
  });

  it("updateMemberRole patches the role route with the member's user id and role in the body", async () => {
    const { client, projectInstance } = makeClient();
    await updateMemberRole(client, {
      spaceId: "s1",
      userId: "u-target",
      role: "moderator",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/members/u-target/role",
      { role: "moderator" }
    );
  });

  it("addMember posts the target userId to /spaces/:id/members (no actingUserId — actor derived from token)", async () => {
    const { client, projectInstance } = makeClient();
    await addMember(client, { spaceId: "s1", userId: "u-target" });
    expect(projectInstance.post).toHaveBeenCalledWith("/spaces/s1/members", {
      userId: "u-target",
    });
  });

  it("addMember returns the membership record", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("active", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });
    await expect(addMember(client, { spaceId: "s1", userId: "u-target" })).resolves.toEqual(result);
  });

  it("approveMembership posts the approve route for the member's user id with no body", async () => {
    const { client, projectInstance } = makeClient();
    await approveMembership(client, { spaceId: "s1", userId: "u-target" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/spaces/s1/members/u-target/approve"
    );
    expect(projectInstance.post.mock.calls[0]).toHaveLength(1);
  });

  it("declineMembership posts the decline route for the member's user id with no body", async () => {
    const { client, projectInstance } = makeClient();
    await declineMembership(client, { spaceId: "s1", userId: "u-target" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/spaces/s1/members/u-target/decline"
    );
    expect(projectInstance.post.mock.calls[0]).toHaveLength(1);
  });

  it("banMember posts the ban route, sending the optional reason", async () => {
    const { client, projectInstance } = makeClient();
    await banMember(client, { spaceId: "s1", userId: "u-target", reason: "spam" });
    expect(projectInstance.post).toHaveBeenCalledWith("/spaces/s1/members/u-target/ban", {
      reason: "spam",
    });
  });

  it("unbanMember posts the unban route for the member's user id with no body", async () => {
    const { client, projectInstance } = makeClient();
    await unbanMember(client, { spaceId: "s1", userId: "u-target" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/spaces/s1/members/u-target/unban"
    );
    expect(projectInstance.post.mock.calls[0]).toHaveLength(1);
  });
});

describe("js-sdk spaces (membership) — response mapping", () => {
  it("joinSpace returns the membership record", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("active", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });

    const response = await joinSpace(client, { spaceId: "s1" });

    expect(response).toEqual(result);
  });

  it("leaveSpace resolves with nothing (204)", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.delete.mockResolvedValueOnce({ data: "", status: 204 });

    const response = await leaveSpace(client, { spaceId: "s1" });

    expect(response).toBeUndefined();
  });

  it("checkMyMembership returns the CheckMyMembershipResponse", async () => {
    const { client, projectInstance } = makeClient();
    const result = {
      isMember: true,
      role: "member" as const,
      status: "active" as const,
      joinedAt: "now",
      permissions: {
        canPost: true,
        canModerate: false,
        canRead: true,
        isAdmin: false,
        isModerator: false,
      },
    };
    projectInstance.get.mockResolvedValueOnce({ data: result });

    const response = await checkMyMembership(client, { spaceId: "s1" });

    expect(response).toEqual(result);
  });

  it("fetchSpaceMembers returns the full PaginatedResponse envelope", async () => {
    const { client, projectInstance } = makeClient();
    const envelope = {
      data: [
        {
          membershipId: "m1",
          role: "member",
          status: "active",
          joinedAt: "now",
          user: { id: "u1", username: "alice", displayName: "Alice", avatar: "", metadata: {} },
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 1,
        hasMore: false,
      },
    };
    projectInstance.get.mockResolvedValueOnce({ data: envelope });

    const result = await fetchSpaceMembers(client, { spaceId: "s1" });

    expect(result).toEqual(envelope);
  });

  it("fetchSpaceTeam returns the unpaginated SpaceTeamResponse", async () => {
    const { client, projectInstance } = makeClient();
    const result = {
      data: [
        {
          membershipId: "m1",
          role: "admin",
          status: "active",
          joinedAt: "now",
          user: { id: "u1", username: "alice", displayName: "Alice", avatar: "", metadata: {} },
        },
      ],
    };
    projectInstance.get.mockResolvedValueOnce({ data: result });

    const response = await fetchSpaceTeam(client, { spaceId: "s1" });

    expect(response).toEqual(result);
  });

  it("updateMemberRole returns the membership record", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("active", "moderator");
    projectInstance.patch.mockResolvedValueOnce({ data: result });

    const response = await updateMemberRole(client, {
      spaceId: "s1",
      userId: "u-target",
      role: "moderator",
    });

    expect(response).toEqual(result);
  });

  it("approveMembership returns the membership record", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("active", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });

    const response = await approveMembership(client, {
      spaceId: "s1",
      userId: "u-target",
    });

    expect(response).toEqual(result);
  });

  it("declineMembership returns the membership record", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("rejected", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });

    const response = await declineMembership(client, {
      spaceId: "s1",
      userId: "u-target",
    });

    expect(response).toEqual(result);
  });

  it("banMember returns the membership record", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("banned", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });

    const response = await banMember(client, { spaceId: "s1", userId: "u-target" });

    expect(response).toEqual(result);
  });

  it("unbanMember returns the membership record", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("active", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });

    const response = await unbanMember(client, {
      spaceId: "s1",
      userId: "u-target",
    });

    expect(response).toEqual(result);
  });
});
