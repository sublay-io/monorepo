import React, { useContext } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeSpaceDetailed,
  makeMemberPermissions,
} from "../../test-utils";
import { makeProvidersWrapper } from "../../context/testHelpers";
import { SpaceProvider, SpaceContext } from "../../context/space-context";
import useUpdateSpace from "./useUpdateSpace";

afterEach(() => {
  resetAxiosMocks();
});

describe("useUpdateSpace", () => {
  it("updates a space via a plain JSON request when there are no image uploads", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateSpace());

    const updated = makeSpaceDetailed({ name: "New name" });
    axiosPrivate.mockResponse("patch", updated);

    let returned;
    await act(async () => {
      returned = await result.current({
        spaceId: "space-1",
        update: { name: "New name" },
      });
    });

    expect(returned).toEqual(updated);

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/spaces/space-1");
    expect(call.body).toEqual({ name: "New name" });
  });

  it("merges a JSON update onto the SpaceProvider's space, keeping its hierarchy", async () => {
    const parentSpace = { id: "parent-1", shortId: "p1", name: "Parent", slug: null, avatarFileId: null };
    const childSpaces = [{ id: "child-1", shortId: "c1", name: "Child", slug: null, avatarFileId: null }];
    const space = makeSpaceDetailed({ id: "space-1", name: "Old", parentSpace, childSpaces });

    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", { breadcrumb: [] }),
    });

    const { result } = renderHook(
      () => ({ updateSpace: useUpdateSpace(), context: useContext(SpaceContext) }),
      {
        wrapper: ({ children }) => (
          <Wrapper>
            <SpaceProvider space={space}>{children}</SpaceProvider>
          </Wrapper>
        ),
      },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    // The update response: the space plus memberPermissions, without
    // parentSpace / childSpaces.
    const { parentSpace: _p, childSpaces: _c, ...base } = space;
    const memberPermissions = makeMemberPermissions({
      isMember: true,
      isAdmin: true,
      status: "active",
      canPost: true,
      canModerate: true,
    });
    axiosPrivate.mockResponse("patch", { ...base, name: "New", memberPermissions });

    await act(async () => {
      await result.current.updateSpace({ spaceId: "space-1", update: { name: "New" } });
    });

    expect(result.current.context.space?.name).toBe("New");
    expect(result.current.context.space?.memberPermissions).toEqual(memberPermissions);
    expect(result.current.context.space?.parentSpace).toEqual(parentSpace);
    expect(result.current.context.space?.childSpaces).toEqual(childSpaces);
  });

  it("merges a multipart update onto the SpaceProvider's space too", async () => {
    const space = makeSpaceDetailed({ id: "space-1", avatarFileId: null });
    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", { breadcrumb: [] }),
    });
    const { result } = renderHook(
      () => ({ updateSpace: useUpdateSpace(), context: useContext(SpaceContext) }),
      {
        wrapper: ({ children }) => (
          <Wrapper>
            <SpaceProvider space={space}>{children}</SpaceProvider>
          </Wrapper>
        ),
      },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    const { parentSpace: _p, childSpaces: _c, ...base } = space;
    axiosPrivate.mockResponse("patch", { ...base, avatarFileId: "file-new" });

    const file = new File(["binary"], "avatar.png", { type: "image/png" });
    await act(async () => {
      await result.current.updateSpace({
        spaceId: "space-1",
        update: { avatarFile: { file, options: { mode: "original-aspect", sizes: { small: 64 } } } },
      });
    });

    expect(result.current.context.space?.avatarFileId).toBe("file-new");
  });

  it("updates a space via multipart FormData when a banner is provided", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateSpace());

    axiosPrivate.mockResponse("patch", makeSpaceDetailed());

    const file = new File(["binary"], "banner.png", { type: "image/png" });

    await act(async () => {
      await result.current({
        spaceId: "space-1",
        update: {
          name: "New name",
          bannerFile: { file, options: { mode: "original-aspect", sizes: { full: 1200 } } },
          removeFileIds: ["11111111-1111-4111-8111-111111111111"],
        },
      });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/spaces/space-1");
    expect(call.body instanceof FormData).toBe(true);
    const formData = call.body as FormData;
    expect([...formData.keys()].sort()).toEqual(
      ["bannerFile", "bannerFile.options", "name", "removeFileIds"],
    );
    expect(formData.get("name")).toBe("New name");
    expect(formData.get("bannerFile")).toBeInstanceOf(File);
    expect(formData.get("bannerFile.options")).toBe(
      JSON.stringify({ mode: "original-aspect", sizes: { full: 1200 } }),
    );
    expect(formData.get("removeFileIds")).toBe(
      JSON.stringify(["11111111-1111-4111-8111-111111111111"]),
    );
  });

  it("sends avatarFile + avatarFile.options for a new avatar", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateSpace());
    axiosPrivate.mockResponse("patch", makeSpaceDetailed());

    const file = new File(["binary"], "avatar.png", { type: "image/png" });
    const options = { mode: "original-aspect" as const, sizes: { small: 64 } };
    await act(async () => {
      await result.current({ spaceId: "space-1", update: { avatarFile: { file, options } } });
    });

    const formData = axiosPrivate.calls("patch")[0].body as FormData;
    expect([...formData.keys()].sort()).toEqual(["avatarFile", "avatarFile.options"]);
    expect((formData.get("avatarFile") as File).name).toBe("avatar.png");
    expect(formData.get("avatarFile.options")).toBe(JSON.stringify(options));
  });

  it("leaves out `slug: null` on a multipart update, and sends it on a JSON one", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateSpace());
    axiosPrivate.mockResponse("patch", makeSpaceDetailed());
    axiosPrivate.mockResponse("patch", makeSpaceDetailed());

    const file = new File(["binary"], "avatar.png", { type: "image/png" });
    await act(async () => {
      await result.current({
        spaceId: "space-1",
        update: { slug: null, avatarFile: { file, options: { mode: "original-aspect", sizes: { small: 64 } } } },
      });
      await result.current({ spaceId: "space-1", update: { slug: null } });
    });

    const [multipart, json] = axiosPrivate.calls("patch");
    expect((multipart.body as FormData).has("slug")).toBe(false);
    expect(json.body).toEqual({ slug: null });
  });

  it("sends removeFileIds alone as JSON", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateSpace());
    axiosPrivate.mockResponse("patch", makeSpaceDetailed());

    const id = "11111111-1111-4111-8111-111111111111";
    await act(async () => {
      await result.current({ spaceId: "space-1", update: { removeFileIds: [id] } });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body).toEqual({ removeFileIds: [id] });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateSpace());

    axiosPrivate.mockError("patch", 500, { message: "Internal error" });

    await expect(
      result.current({ spaceId: "space-1", update: { name: "New name" } }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateSpace());

    await expect(
      result.current({ spaceId: "", update: { name: "New name" } }),
    ).rejects.toThrow("Please pass a spaceId");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});
