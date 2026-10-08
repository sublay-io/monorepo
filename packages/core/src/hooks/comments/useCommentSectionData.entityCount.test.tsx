import React, { useState } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";

import {
  makeAuthUser,
  makeSublayStore,
  mockAxiosPrivate,
  resetAxiosMocks,
} from "../../test-utils";
import { setInitialized, setTokens, setUser } from "../../store/slices/authSlice";
import { SublayContext, type SublayContextValues } from "../../context/sublay-context";
import { EntityContext } from "../../context/entity-context";
import useCommentSectionData from "./useCommentSectionData";
import useEntity from "../entities/useEntity";
import { makeComment, makeEntity } from "./testHelpers";
import type { Entity } from "../../interfaces/models/Entity";

afterEach(() => {
  resetAxiosMocks();
});

const emptyPage = { data: [], pagination: { nextCursor: null, hasMore: false } };

function renderWithEntity(entity: Entity) {
  const store = makeSublayStore();
  store.dispatch(setTokens({ accessToken: null, refreshToken: null }));
  store.dispatch(setUser(makeAuthUser({ id: "user-1", username: "alice" })));
  store.dispatch(setInitialized(true));
  const axiosPrivate = mockAxiosPrivate();
  axiosPrivate.mockResponse("get", emptyPage);

  function Wrapper({ children }: { children: React.ReactNode }) {
    const [current, setCurrent] = useState<Entity | null | undefined>(entity);
    return (
      <Provider store={store}>
        <SublayContext.Provider
          value={{ projectId: "test-project", project: null } as SublayContextValues}
        >
          <EntityContext.Provider value={{ entity: current, setEntity: setCurrent }}>
            {children}
          </EntityContext.Provider>
        </SublayContext.Provider>
      </Provider>
    );
  }

  const rendered = renderHook(
    () => ({ section: useCommentSectionData({}), entity: useEntity().entity }),
    { wrapper: Wrapper },
  );
  return { ...rendered, axiosPrivate };
}

describe("useCommentSectionData — entity commentsCount (D24)", () => {
  it("+1 on create, rolled back on failure, unchanged on delete", async () => {
    const { result, axiosPrivate } = renderWithEntity(
      makeEntity({ id: "entity-1", commentsCount: 5 }),
    );
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    const id = "11111111-1111-4111-8111-111111111111";
    axiosPrivate.mockResponse("post", makeComment({ id }), 201);
    await act(async () => {
      await result.current.section.createComment({ content: "hello" });
    });
    expect(result.current.entity?.commentsCount).toBe(6);

    axiosPrivate.mockError("post", 500, {});
    await act(async () => {
      await result.current.section.createComment({ content: "again" });
    });
    expect(result.current.entity?.commentsCount).toBe(6);

    axiosPrivate.mockResponse("delete", undefined, 204);
    await act(async () => {
      await result.current.section.deleteComment({ commentId: id });
    });
    expect(result.current.entity?.commentsCount).toBe(6);
  });
});
