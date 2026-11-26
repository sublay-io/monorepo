import { describe, it, expect } from "vitest";

import userSlice, {
  setUser,
  clearUser,
  setProjectContext,
  setLoading,
  setUpdating,
  setError,
  clearError,
  updateUserOptimistic,
  selectUser,
  selectUserLoading,
  selectUserUpdating,
  selectCurrentProjectId,
  selectUserError,
  selectUserById,
  type UserState,
} from "./userSlice";
import type { AuthUser } from "../../interfaces/models/User";

const reducer = userSlice.reducer;

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser =>
  ({
    id: "user-1",
    projectId: "test-project",
    foreignId: null,
    role: "visitor",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
    avatar: null,
    avatarFileId: null,
    bannerFileId: null,
    bio: null,
    birthdate: null,
    location: null,
    metadata: {},
    reputation: 0,
    isVerified: false,
    isActive: true,
    lastActive: "2024-01-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    suspensions: [],
    authMethods: ["password"],
    ...overrides,
  }) as AuthUser;

const initial: UserState = {
  user: null,
  loading: false,
  updating: false,
  currentProjectId: undefined,
  error: null,
};

describe("userSlice", () => {
  it("setUser stores the user and clears any existing error", () => {
    const s = reducer({ ...initial, error: { message: "boom" } }, setUser(makeUser()));
    expect(s.user?.id).toBe("user-1");
    expect(s.error).toBeNull();
  });

  it("setUser(null) clears the user", () => {
    const s = reducer({ ...initial, user: makeUser() }, setUser(null));
    expect(s.user).toBeNull();
  });

  it("clearUser clears the user and any error", () => {
    const s = reducer({ ...initial, user: makeUser(), error: { message: "boom" } }, clearUser());
    expect(s.user).toBeNull();
    expect(s.error).toBeNull();
  });

  it("setProjectContext updates the project id only when it changes", () => {
    const s1 = reducer(initial, setProjectContext("project-1"));
    expect(s1.currentProjectId).toBe("project-1");
    // Same value again — still set (the guard only prevents a redundant *different* write internally,
    // but produces the same observable result either way).
    const s2 = reducer(s1, setProjectContext("project-1"));
    expect(s2.currentProjectId).toBe("project-1");
  });

  it("setLoading / setUpdating / setError / clearError set their fields", () => {
    let s = reducer(initial, setLoading(true));
    expect(s.loading).toBe(true);
    s = reducer(s, setUpdating(true));
    expect(s.updating).toBe(true);
    s = reducer(s, setError({ message: "boom" }));
    expect(s.error).toEqual({ message: "boom" });
    s = reducer(s, clearError());
    expect(s.error).toBeNull();
  });

  describe("updateUserOptimistic", () => {
    it("merges the partial update into the existing user", () => {
      const s = reducer(
        { ...initial, user: makeUser({ name: "Old" }) },
        updateUserOptimistic({ name: "New" }),
      );
      expect(s.user?.name).toBe("New");
      expect(s.user?.username).toBe("testuser"); // untouched
    });

    it("is a no-op when there is no current user", () => {
      const s = reducer(initial, updateUserOptimistic({ name: "New" }));
      expect(s.user).toBeNull();
    });
  });

  describe("selectors", () => {
    it("read each field through the namespaced state", () => {
      const s: UserState = {
        user: makeUser(),
        loading: true,
        updating: true,
        currentProjectId: "project-1",
        error: { message: "boom" },
      };
      const state = { sublay: { user: s } } as never;

      expect(selectUser(state)).toEqual(s.user);
      expect(selectUserLoading(state)).toBe(true);
      expect(selectUserUpdating(state)).toBe(true);
      expect(selectCurrentProjectId(state)).toBe("project-1");
      expect(selectUserError(state)).toEqual({ message: "boom" });
    });

    it("selectUserById returns the user only when the id matches", () => {
      const s: UserState = { ...initial, user: makeUser({ id: "user-1" }) };
      const state = { sublay: { user: s } } as never;

      expect(selectUserById("user-1")(state)?.id).toBe("user-1");
      expect(selectUserById("user-2")(state)).toBeNull();
    });
  });
});
