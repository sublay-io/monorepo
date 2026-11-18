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
import { makeClient } from "./helpers/mockClient";

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

describe("node-sdk spaces (membership) — request shaping", () => {
  it("joinSpace posts actingUserId to /spaces/:id/join", async () => {
    const { client, projectInstance } = makeClient();
    await joinSpace(client, { spaceId: "s1", actingUserId: "u1" });
    expect(projectInstance.post).toHaveBeenCalledWith("/spaces/s1/join", {
      actingUserId: "u1",
    });
  });

  it("leaveSpace sends actingUserId as a param to /spaces/:id/members/me", async () => {
    const { client, projectInstance } = makeClient();
    await leaveSpace(client, { spaceId: "s1", actingUserId: "u1" });
    expect(projectInstance.delete).toHaveBeenCalledWith("/spaces/s1/members/me", {
      params: { actingUserId: "u1" },
    });
  });

  it("checkMyMembership sends actingUserId as a param to /spaces/:id/members/me", async () => {
    const { client, projectInstance } = makeClient();
    await checkMyMembership(client, { spaceId: "s1", actingUserId: "u1" });
    expect(projectInstance.get).toHaveBeenCalledWith(
      "/spaces/s1/members/me",
      { params: { actingUserId: "u1" } },
    );
  });

  it("fetchSpaceMembers strips spaceId into the path and passes the rest as params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchSpaceMembers(client, { spaceId: "s1", role: "admin", page: 1, actingUserId: "u1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/members", {
      params: { role: "admin", page: 1, actingUserId: "u1" },
    });
  });

  it("fetchSpaceTeam strips spaceId into the path and passes the rest as params", async () => {
    const { client, projectInstance } = makeClient();
    await fetchSpaceTeam(client, { spaceId: "s1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/team", {
      params: {},
    });
  });

  it("fetchSpaceTeam sends actingUserId as a query param", async () => {
    const { client, projectInstance } = makeClient();
    await fetchSpaceTeam(client, { spaceId: "s1", actingUserId: "u1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/spaces/s1/team", {
      params: { actingUserId: "u1" },
    });
  });

  it("updateMemberRole patches the role route with role and actingUserId in the body", async () => {
    const { client, projectInstance } = makeClient();
    await updateMemberRole(client, {
      spaceId: "s1",
      userId: "u-target",
      role: "moderator",
      actingUserId: "u-actor",
    });
    expect(projectInstance.patch).toHaveBeenCalledWith(
      "/spaces/s1/members/u-target/role",
      { role: "moderator", actingUserId: "u-actor" },
    );
  });

  it("addMember posts the target userId and actingUserId to /spaces/:id/members", async () => {
    const { client, projectInstance } = makeClient();
    await addMember(client, { spaceId: "s1", userId: "u-target", actingUserId: "u-actor" });
    expect(projectInstance.post).toHaveBeenCalledWith("/spaces/s1/members", {
      userId: "u-target",
      actingUserId: "u-actor",
    });
  });

  it("addMember returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("active", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });
    await expect(
      addMember(client, { spaceId: "s1", userId: "u-target", actingUserId: "u-actor" }),
    ).resolves.toEqual(result);
  });

  it("approveMembership posts the approve route sending actingUserId in the body", async () => {
    const { client, projectInstance } = makeClient();
    await approveMembership(client, { spaceId: "s1", userId: "u-target", actingUserId: "u-actor" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/spaces/s1/members/u-target/approve",
      { actingUserId: "u-actor" },
    );
  });

  it("declineMembership posts the decline route sending actingUserId in the body", async () => {
    const { client, projectInstance } = makeClient();
    await declineMembership(client, { spaceId: "s1", userId: "u-target", actingUserId: "u-actor" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/spaces/s1/members/u-target/decline",
      { actingUserId: "u-actor" },
    );
  });

  it("banMember posts the ban route, sending the optional reason and actingUserId", async () => {
    const { client, projectInstance } = makeClient();
    await banMember(client, {
      spaceId: "s1",
      userId: "u-target",
      reason: "spam",
      actingUserId: "u-actor",
    });
    expect(projectInstance.post).toHaveBeenCalledWith("/spaces/s1/members/u-target/ban", {
      reason: "spam",
      actingUserId: "u-actor",
    });
  });

  it("unbanMember posts the unban route sending actingUserId in the body", async () => {
    const { client, projectInstance } = makeClient();
    await unbanMember(client, { spaceId: "s1", userId: "u-target", actingUserId: "u-actor" });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/spaces/s1/members/u-target/unban",
      { actingUserId: "u-actor" },
    );
  });
});

describe("node-sdk spaces (membership) — response mapping", () => {
  it("joinSpace returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("active", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });
    await expect(
      joinSpace(client, { spaceId: "s1", actingUserId: "u1" }),
    ).resolves.toEqual(result);
  });

  it("leaveSpace resolves with nothing (204)", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.delete.mockResolvedValueOnce({ data: "", status: 204 });
    await expect(
      leaveSpace(client, { spaceId: "s1", actingUserId: "u1" }),
    ).resolves.toBeUndefined();
  });

  it("checkMyMembership returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = {
      isMember: true,
      role: "member",
      status: "active",
      joinedAt: "now",
      permissions: { canPost: true, canModerate: false, canRead: true, isAdmin: false, isModerator: false },
    };
    projectInstance.get.mockResolvedValueOnce({ data: result });
    await expect(
      checkMyMembership(client, { spaceId: "s1", actingUserId: "u1" }),
    ).resolves.toEqual(result);
  });

  it("fetchSpaceMembers returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { data: [{ id: "m1" }], pagination: { page: 1, limit: 10, total: 1 } };
    projectInstance.get.mockResolvedValueOnce({ data: result });
    await expect(fetchSpaceMembers(client, { spaceId: "s1" })).resolves.toEqual(result);
  });

  it("fetchSpaceTeam returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = { admins: [], moderators: [] };
    projectInstance.get.mockResolvedValueOnce({ data: result });
    await expect(fetchSpaceTeam(client, { spaceId: "s1" })).resolves.toEqual(result);
  });

  it("updateMemberRole returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("active", "moderator");
    projectInstance.patch.mockResolvedValueOnce({ data: result });
    await expect(
      updateMemberRole(client, {
        spaceId: "s1",
        userId: "u-target",
        role: "moderator",
        actingUserId: "u-actor",
      }),
    ).resolves.toEqual(result);
  });

  it("approveMembership returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("active", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });
    await expect(
      approveMembership(client, { spaceId: "s1", userId: "u-target", actingUserId: "u-actor" }),
    ).resolves.toEqual(result);
  });

  it("declineMembership returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("rejected", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });
    await expect(
      declineMembership(client, { spaceId: "s1", userId: "u-target", actingUserId: "u-actor" }),
    ).resolves.toEqual(result);
  });

  it("banMember returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("banned", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });
    await expect(
      banMember(client, { spaceId: "s1", userId: "u-target", actingUserId: "u-actor" }),
    ).resolves.toEqual(result);
  });

  it("unbanMember returns response.data", async () => {
    const { client, projectInstance } = makeClient();
    const result = membershipRecord("active", "member");
    projectInstance.post.mockResolvedValueOnce({ data: result });
    await expect(
      unbanMember(client, { spaceId: "s1", userId: "u-target", actingUserId: "u-actor" }),
    ).resolves.toEqual(result);
  });
});
