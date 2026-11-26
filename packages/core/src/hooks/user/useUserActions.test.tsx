import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  mockAxiosPrivate,
  resetAxiosMocks,
  type FetchMockHandle,
} from "../../test-utils";
import { useUserActions } from "./useUserActions";
import { selectUser, selectUserUpdating, selectUserError, setError } from "../../store/slices/userSlice";
import type { AuthUser } from "../../interfaces/models/User";

let fetchHandle: FetchMockHandle;

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser =>
  ({ id: "user-1", name: "Old", username: "olduser", ...overrides }) as AuthUser;

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
  resetAxiosMocks();
});

describe("useUserActions", () => {
  describe("setUser", () => {
    it("stores a valid user and clears any existing error", () => {
      const { result, store } = renderHookWithStore(() => useUserActions());
      act(() => result.current.setUser(makeUser()));
      expect(selectUser(store.getState())?.id).toBe("user-1");
    });

    it("ignores a user object missing an id, with a warning", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { result, store } = renderHookWithStore(() => useUserActions());

      act(() => result.current.setUser({ name: "No Id" } as never));

      expect(selectUser(store.getState())).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("setUser(null) is valid and clears the user", () => {
      const { result, store } = renderHookWithStore(() => useUserActions());
      act(() => result.current.setUser(makeUser()));
      act(() => result.current.setUser(null));
      expect(selectUser(store.getState())).toBeNull();
    });
  });

  it("clearUser clears the user and error", () => {
    const { result, store } = renderHookWithStore(() => useUserActions());
    act(() => result.current.setUser(makeUser()));
    act(() => result.current.clearUser());
    expect(selectUser(store.getState())).toBeNull();
    expect(selectUserError(store.getState())).toBeNull();
  });

  describe("updateUser", () => {
    it("throws without a projectId or userId", async () => {
      const { result } = renderHookWithStore(() => useUserActions());

      await expect(
        result.current.updateUser({ projectId: "", userId: "user-1", update: {} }),
      ).rejects.toThrow("Project ID and User ID are required");
    });

    it("applies an optimistic update, then replaces it with the server response", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({ id: "user-1", name: "Server Name" }),
      );
      const { result, store } = renderHookWithStore(() => useUserActions());
      const currentUser = makeUser();

      let returned: AuthUser | undefined;
      await act(async () => {
        returned = await result.current.updateUser({
          projectId: "test-project",
          userId: "user-1",
          update: { name: "New Name" },
          currentUser,
        });
      });

      expect(returned?.name).toBe("Server Name");
      expect(selectUser(store.getState())?.name).toBe("Server Name");
      expect(selectUserUpdating(store.getState())).toBe(false);
    });

    it("sends an update with files as multipart through axios, not the JSON RTK endpoint", async () => {
      const axiosPrivate = mockAxiosPrivate();
      axiosPrivate.mockResponse("patch", {
        id: "user-1",
        avatarFile: { id: "file-new" },
        avatar: "https://cdn.example/avatar.png",
      });
      const { result, store } = renderHookWithStore(() => useUserActions());
      const currentUser = makeUser({ avatar: null });
      const options = { mode: "original-aspect" as const, sizes: { small: 64 } };

      await act(async () => {
        await result.current.updateUser({
          projectId: "test-project",
          userId: "user-1",
          update: {
            name: "New",
            avatarFile: { file: new File(["x"], "a.png", { type: "image/png" }), options },
            removeFileIds: ["11111111-1111-4111-8111-111111111111"],
          },
          currentUser,
        });
      });

      // Nothing went through RTK's fetch (which would send the FormData under a
      // JSON content type, i.e. as an empty body).
      expect(fetchHandle.calls()).toHaveLength(0);
      const [call] = axiosPrivate.calls("patch");
      expect(call.url).toBe("/test-project/users/user-1");
      expect(call.body).toBeInstanceOf(FormData);
      const formData = call.body as FormData;
      expect([...formData.keys()].sort()).toEqual(
        ["avatarFile", "avatarFile.options", "name", "removeFileIds"],
      );
      expect((formData.get("avatarFile") as File).name).toBe("a.png");
      expect(formData.get("avatarFile.options")).toBe(JSON.stringify(options));
      expect(formData.get("removeFileIds")).toBe(
        JSON.stringify(["11111111-1111-4111-8111-111111111111"]),
      );

      // The server's user replaces the state, as for a JSON update.
      expect(selectUser(store.getState())?.avatarFile?.id).toBe("file-new");
      expect(selectUser(store.getState())?.avatar).toBe("https://cdn.example/avatar.png");
      expect(selectUserUpdating(store.getState())).toBe(false);
    });

    it("throws on `avatar: null` with a file, before sending or changing anything", async () => {
      const axiosPrivate = mockAxiosPrivate();
      const spy = vi.spyOn(axiosPrivate.instance, "patch");
      const { result, store } = renderHookWithStore(() => useUserActions());
      act(() => result.current.setUser(makeUser({ avatar: "https://cdn.example/old.png" })));

      await expect(
        result.current.updateUser({
          projectId: "test-project",
          userId: "user-1",
          update: {
            avatar: null,
            avatarFile: { file: new File(["x"], "a.png"), options: { mode: "original-aspect", sizes: { small: 64 } } },
          },
          currentUser: makeUser({ avatar: "https://cdn.example/old.png" }),
        }),
      ).rejects.toThrow("`avatar: null` can't be sent with a file");

      expect(spy).not.toHaveBeenCalled();
      expect(selectUser(store.getState())?.avatar).toBe("https://cdn.example/old.png");
      expect(selectUserUpdating(store.getState())).toBe(false);
    });

    it("clears the URL avatar optimistically on a JSON `avatar: null`", async () => {
      fetchHandle.fetchMock.mockImplementationOnce(() => new Promise(() => {}));
      const { result, store } = renderHookWithStore(() => useUserActions());
      act(() => result.current.setUser(makeUser({ avatar: "https://cdn.example/old.png" })));

      act(() => {
        void result.current.updateUser({
          projectId: "test-project",
          userId: "user-1",
          update: { avatar: null },
          currentUser: makeUser({ avatar: "https://cdn.example/old.png" }),
        });
      });

      expect(selectUser(store.getState())?.avatar).toBeNull();
    });

    it("reverts and records the error when a multipart update fails", async () => {
      const axiosPrivate = mockAxiosPrivate();
      axiosPrivate.mockError("patch", 400, { code: "user/invalid-remove-file-ids" });
      const { result, store } = renderHookWithStore(() => useUserActions());
      const currentUser = makeUser();

      await act(async () => {
        await expect(
          result.current.updateUser({
            projectId: "test-project",
            userId: "user-1",
            update: {
              name: "New Name",
              bannerFile: { file: new File(["x"], "b.png"), options: { mode: "original-aspect", sizes: { full: 1200 } } },
            },
            currentUser,
          }),
        ).rejects.toBeTruthy();
      });

      expect(selectUser(store.getState())?.name).toBe("Old");
      expect(selectUserError(store.getState())).toBeTruthy();
    });

    it("sends removeFileIds without files as JSON", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "user-1", avatarFileId: null }));
      const { result } = renderHookWithStore(() => useUserActions());

      await act(async () => {
        await result.current.updateUser({
          projectId: "test-project",
          userId: "user-1",
          update: { removeFileIds: ["11111111-1111-4111-8111-111111111111"] },
          currentUser: makeUser(),
        });
      });

      const [call] = fetchHandle.calls();
      expect(call.method).toBe("PATCH");
      expect(JSON.parse(call.body as string)).toEqual({
        removeFileIds: ["11111111-1111-4111-8111-111111111111"],
      });
    });

    it("reverts to the original user and records the error message on failure", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(() => useUserActions());
      const currentUser = makeUser();

      await act(async () => {
        await expect(
          result.current.updateUser({
            projectId: "test-project",
            userId: "user-1",
            update: { name: "New Name" },
            currentUser,
          }),
        ).rejects.toBeTruthy();
      });

      expect(selectUser(store.getState())?.name).toBe("Old"); // reverted
      expect(selectUserUpdating(store.getState())).toBe(false);
      expect(selectUserError(store.getState())).toBeTruthy();
    });
  });

  it("clearError clears the error field", () => {
    const { result, store } = renderHookWithStore(() => useUserActions());
    act(() => store.dispatch(setError({ message: "boom" })));
    expect(selectUserError(store.getState())).toEqual({ message: "boom" });

    act(() => result.current.clearError());
    expect(selectUserError(store.getState())).toBeNull();
  });
});
