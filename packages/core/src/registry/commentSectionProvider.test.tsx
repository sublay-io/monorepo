import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";

import { makeAuthUser, makeSublayStore, resetAxiosMocks } from "../test-utils";
import { setInitialized, setTokens, setUser } from "../store/slices/authSlice";
import { SublayContext, type SublayContextValues } from "../context/sublay-context";
import { EntityContext } from "../context/entity-context";
import { axiosPrivate } from "../config/axios";
import useCommentSection from "../hooks/comments/useCommentSection";
import useEntity from "../hooks/entities/useEntity";
import { makeComment, makeEntity } from "../hooks/comments/testHelpers";
import type { Comment } from "../interfaces/models/Comment";
import type { Entity } from "../interfaces/models/Entity";

// The comment components' own hooks (`useThreadedComments` /
// `useSocialComments`, in ../../../../registry) build the provider every
// section renders inside. These tests run each variant's real hook against
// the real `CommentSectionProvider` and check that a change to what the
// section is given reaches the section and never unmounts what's inside it.
//
// The last test renders each variant's real section component, to check a
// prop given to the component reaches the entity lookup request.
//
// The hooks and sections are loaded by path at run time so this package's
// typecheck doesn't reach into the registry, and the UI files they import are
// replaced with empty components (they need packages this one doesn't depend
// on).
// `@sublay/react-js` / `@sublay/react-native` resolve to this package's
// source, and `react-native` to a stub: see vitest.config.ts.

const REGISTRY = new URL("../../../../registry", import.meta.url).pathname.replace(/\/$/, "");

const WEB_FILES = [
  "files/comments-feed/comments-feed",
  "files/new-comment-form",
  "files/modals/comment-menu-modal/comment-menu-modal",
  "files/modals/comment-menu-modal-owner/comment-menu-modal-owner",
];
const NATIVE_FILES = [
  "files/comments-feed/comments-feed",
  "files/new-comment-form/new-comment-form",
  "files/sheets/comment-options-sheet",
  "files/sheets/comment-options-sheet-owner",
  "files/sheets/report-comment-sheet",
];

const VARIANTS: {
  dir: string;
  hook: string;
  /** The section component's file, under `files/`. */
  section: string;
  files: string[];
  /** Mocked files with named exports instead of a default one. */
  namedFiles?: Record<string, string>;
  native?: boolean;
  /** The tailwind web variants take their theme from a `dark` class, not a prop. */
  noThemeProp?: boolean;
}[] = [
  {
    dir: "react/comments-threaded/styled",
    hook: "use-threaded-comments",
    section: "threaded-comment-section",
    files: WEB_FILES,
  },
  {
    dir: "react/comments-threaded/tailwind",
    hook: "use-threaded-comments",
    section: "threaded-comment-section",
    files: WEB_FILES,
    noThemeProp: true,
  },
  {
    dir: "react/comments-social/styled",
    hook: "use-social-comments",
    section: "social-comment-section",
    files: WEB_FILES,
    namedFiles: { "files/sort-by-button": "SortByButton" },
  },
  {
    dir: "react/comments-social/tailwind",
    hook: "use-social-comments",
    section: "social-comment-section",
    namedFiles: { "files/sort-by-button": "SortByButton" },
    files: WEB_FILES,
    noThemeProp: true,
  },
  {
    dir: "react-native/comments-threaded/tailwind",
    hook: "use-threaded-comments",
    section: "threaded-comment-section",
    files: NATIVE_FILES,
    native: true,
  },
  {
    dir: "react-native/comments-social/styled",
    hook: "use-social-comments",
    section: "social-comment-section",
    files: [...NATIVE_FILES, "files/sort-by-button/sort-by-button"],
    native: true,
  },
  {
    dir: "react-native/comments-social/tailwind",
    hook: "use-social-comments",
    section: "social-comment-section",
    files: [...NATIVE_FILES, "files/sort-by-button/sort-by-button"],
    native: true,
  },
];

type SectionHookProps = {
  entity?: Entity | null;
  entityId?: string | null;
  foreignId?: string | null;
  highlightedCommentId?: string | null;
  theme?: "light" | "dark";
};
type SectionHook = (props: SectionHookProps) => {
  CommentSectionProvider: React.ComponentType<
    Record<string, unknown> & { children: React.ReactNode }
  >;
  providerProps: Record<string, unknown>;
};
type ThemeContext = React.Context<{ theme?: "light" | "dark" }>;
type SectionComponent = React.ComponentType<
  SectionHookProps & { createIfNotFound?: boolean }
>;

type LoadedVariant = {
  useSection: SectionHook;
  ThemeContext: ThemeContext;
  /** The variant's section component (its default export). */
  loadSection: () => Promise<SectionComponent>;
};
const loaded = new Map<string, Promise<LoadedVariant>>();

/** Each variant's modules are mocked and imported once. */
function loadHook(variant: (typeof VARIANTS)[number]): Promise<LoadedVariant> {
  if (!loaded.has(variant.dir)) loaded.set(variant.dir, importVariant(variant));
  return loaded.get(variant.dir)!;
}

async function importVariant(
  variant: (typeof VARIANTS)[number],
): Promise<LoadedVariant> {
  const base = `${REGISTRY}/${variant.dir}`;
  for (const file of variant.files) {
    vi.doMock(`${base}/${file}.tsx`, () => ({ default: () => null }));
  }
  for (const [file, name] of Object.entries(variant.namedFiles ?? {})) {
    vi.doMock(`${base}/${file}.tsx`, () => ({ [name]: () => null }));
  }
  let ThemeContext: ThemeContext;
  if (variant.native) {
    // The native UI state context imports the bottom-sheet package, so it's
    // replaced with one that only carries the theme.
    const NativeThemeContext: ThemeContext = createContext({});
    ThemeContext = NativeThemeContext;
    vi.doMock(`${base}/context/ui-state-context.tsx`, () => ({
      UIStateContext: NativeThemeContext,
      UIStateProvider: ({
        children,
        theme,
      }: {
        children: React.ReactNode;
        theme?: "light" | "dark";
      }) => (
        <NativeThemeContext.Provider value={{ theme }}>
          {children}
        </NativeThemeContext.Provider>
      ),
    }));
  } else {
    const ui = await import(/* @vite-ignore */ `${base}/context/ui-state-context.tsx`);
    ThemeContext = ui.UIStateContext;
  }
  const mod = await import(/* @vite-ignore */ `${base}/hooks/${variant.hook}.tsx`);
  const loadSection = async () =>
    (await import(/* @vite-ignore */ `${base}/files/${variant.section}.tsx`))
      .default as SectionComponent;
  return { useSection: mod.default as SectionHook, ThemeContext, loadSection };
}

const A1 = "11111111-1111-4111-8111-111111111111";
const B1 = "22222222-2222-4222-8222-222222222222";
const NEW = "33333333-3333-4333-8333-333333333333";
const H = "44444444-4444-4444-8444-444444444444";

const ok = (data: unknown, status = 200) =>
  Promise.resolve({ data, status, statusText: "OK", headers: {}, config: {} } as any);
const page = (data: Comment[]) => ({ data, pagination: { nextCursor: null, hasMore: false } });

function mockApi() {
  const get = vi.spyOn(axiosPrivate, "get").mockImplementation((url: string, config?: any) => {
    if (url.endsWith(`/comments/${H}`)) {
      return ok(makeComment({ id: H, entityId: "entity-A", parentId: null }));
    }
    if (url.endsWith("/entities/entity-A")) {
      return ok(makeEntity({ id: "entity-A", commentsCount: 2 }));
    }
    if (url.endsWith("/entities/by-foreign-id")) {
      // Like the server: found only once it has been created.
      if (!config?.params?.createIfNotFound) {
        return Promise.reject({ response: { status: 404, data: { code: "entity/not-found" } } });
      }
      return ok(
        makeEntity({ id: "entity-A", foreignId: config.params.foreignId, commentsCount: 1 }),
      );
    }
    if (url.endsWith("/comments")) {
      const entityId = config?.params?.entityId;
      return ok(
        page([makeComment({ id: entityId === "entity-B" ? B1 : A1, entityId })]),
      );
    }
    return ok(page([]));
  });
  vi.spyOn(axiosPrivate, "post").mockImplementation(() =>
    ok(makeComment({ id: NEW, entityId: "entity-A", content: "hello" }), 201),
  );
  return {
    listCalls: () => get.mock.calls.filter((c) => String(c[0]).endsWith("/comments")),
    /** The `params` of each entity lookup by `foreignId`, in order. */
    lookups: () =>
      get.mock.calls
        .filter((c) => String(c[0]).endsWith("/entities/by-foreign-id"))
        .map((c) => (c[1] as { params: Record<string, unknown> }).params),
  };
}

/** Stands in for the section's UI: local state plus a mount counter. */
function makeProbe(ThemeContext: ThemeContext) {
  const counts = { mounts: 0, unmounts: 0 };
  let section!: ReturnType<typeof useCommentSection>;
  function Probe() {
    const [draft, setDraft] = useState("");
    section = useCommentSection();
    const { theme } = useContext(ThemeContext);
    useEffect(() => {
      counts.mounts += 1;
      return () => {
        counts.unmounts += 1;
      };
    }, []);
    return (
      <div>
        <input
          aria-label="draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <span data-testid="ids">
          {[...(section.newComments ?? []), ...(section.comments ?? [])]
            .map((c) => c.id)
            .join(",")}
        </span>
        <span data-testid="entity">{section.entity?.id ?? ""}</span>
        <span data-testid="theme">{theme ?? ""}</span>
        <span data-testid="count">{String(section.entity?.commentsCount ?? "")}</span>
      </div>
    );
  }
  return { Probe, counts, section: () => section };
}

function makeProviders() {
  const store = makeSublayStore();
  store.dispatch(setTokens({ accessToken: null, refreshToken: null }));
  store.dispatch(setUser(makeAuthUser({ id: "user-1", username: "alice" })));
  store.dispatch(setInitialized(true));
  return function Providers({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <SublayContext.Provider
          value={{ projectId: "test-project", project: null } as SublayContextValues}
        >
          {children}
        </SublayContext.Provider>
      </Provider>
    );
  };
}

afterEach(() => resetAxiosMocks());

describe.each(VARIANTS)("registry $dir — $hook", (variant) => {
  it("keeps the section mounted when the entity object, the highlight or the entity itself changes", async () => {
    const { useSection, ThemeContext } = await loadHook(variant);
    const { listCalls } = mockApi();
    const { Probe, counts } = makeProbe(ThemeContext);
    const Providers = makeProviders();

    function Section(props: SectionHookProps) {
      const { CommentSectionProvider, providerProps } = useSection(props);
      return (
        <CommentSectionProvider {...providerProps}>
          <Probe />
        </CommentSectionProvider>
      );
    }

    const entity = makeEntity({ id: "entity-A", commentsCount: 1 });
    const view = render(<Section entity={entity} />, { wrapper: Providers });
    await waitFor(() => expect(view.getByTestId("ids").textContent).toBe(A1));
    fireEvent.change(view.getByLabelText("draft"), { target: { value: "half-typed reply" } });
    const draft = () => (view.getByLabelText("draft") as HTMLInputElement).value;

    // Same entity, new object (what an updated commentsCount produces).
    const entity2 = { ...entity, commentsCount: 2 };
    view.rerender(<Section entity={entity2} />);
    await new Promise((r) => setTimeout(r, 30));
    expect(counts).toEqual({ mounts: 1, unmounts: 0 });
    expect(draft()).toBe("half-typed reply");
    expect(view.getByTestId("ids").textContent).toBe(A1);
    expect(view.getByTestId("count").textContent).toBe("2");
    expect(listCalls()).toHaveLength(1);

    // A highlighted comment arrives.
    view.rerender(
      <Section entity={entity2} highlightedCommentId={H} />,
    );
    await waitFor(() => expect(view.getByTestId("ids").textContent).toContain(H));
    expect(counts).toEqual({ mounts: 1, unmounts: 0 });
    expect(draft()).toBe("half-typed reply");
    expect(listCalls()).toHaveLength(1);

    // The theme changes.
    view.rerender(
      <Section entity={entity2} highlightedCommentId={H} theme="dark" />,
    );
    expect(counts).toEqual({ mounts: 1, unmounts: 0 });
    if (!variant.noThemeProp) expect(view.getByTestId("theme").textContent).toBe("dark");

    // A different entity: the provider stays mounted and loads its comments.
    view.rerender(<Section entity={makeEntity({ id: "entity-B" })} theme="dark" />);
    await waitFor(() => expect(view.getByTestId("ids").textContent).toBe(B1));
    expect(counts).toEqual({ mounts: 1, unmounts: 0 });
    expect(listCalls()).toHaveLength(2);
  });

  it("follows a changed entity, highlight and theme when the parent memoises the provider element", async () => {
    const { useSection, ThemeContext } = await loadHook(variant);
    const { listCalls } = mockApi();
    const { Probe, counts } = makeProbe(ThemeContext);
    const Providers = makeProviders();

    // What React Compiler makes of a section component: the children and the
    // provider element are cached, and built again only when something the
    // element is made from changes. The changing values have to be part of
    // the element (its props) for the provider to ever see them.
    function Section(props: SectionHookProps) {
      const { CommentSectionProvider, providerProps } = useSection(props);
      const children = useMemo(() => <Probe />, []);
      return useMemo(
        () => <CommentSectionProvider {...providerProps}>{children}</CommentSectionProvider>,
        [CommentSectionProvider, providerProps, children],
      );
    }

    const entityA = makeEntity({ id: "entity-A", commentsCount: 1 });
    const view = render(<Section entity={entityA} theme="light" />, { wrapper: Providers });
    await waitFor(() => expect(view.getByTestId("ids").textContent).toBe(A1));
    fireEvent.change(view.getByLabelText("draft"), { target: { value: "half-typed reply" } });
    const draft = () => (view.getByLabelText("draft") as HTMLInputElement).value;

    // The same entity with a new count.
    // The same object is reused below, so each later step changes one value.
    const entityA2 = { ...entityA, commentsCount: 2 };
    view.rerender(<Section entity={entityA2} theme="light" />);
    await waitFor(() => expect(view.getByTestId("count").textContent).toBe("2"));
    expect(listCalls()).toHaveLength(1);

    // The highlighted comment changes.
    view.rerender(
      <Section entity={entityA2} theme="light" highlightedCommentId={H} />,
    );
    await waitFor(() => expect(view.getByTestId("ids").textContent).toContain(H));

    // The theme changes.
    view.rerender(
      <Section entity={entityA2} theme="dark" highlightedCommentId={H} />,
    );
    if (!variant.noThemeProp) {
      await waitFor(() => expect(view.getByTestId("theme").textContent).toBe("dark"));
    }

    // The entity changes.
    view.rerender(<Section entity={makeEntity({ id: "entity-B" })} theme="dark" />);
    await waitFor(() => expect(view.getByTestId("entity").textContent).toBe("entity-B"));
    await waitFor(() => expect(view.getByTestId("ids").textContent).toBe(B1));
    expect(listCalls()).toHaveLength(2);

    // By id instead of by object.
    view.rerender(<Section entityId="entity-A" theme="dark" />);
    await waitFor(() => expect(view.getByTestId("entity").textContent).toBe("entity-A"));

    expect(counts).toEqual({ mounts: 1, unmounts: 0 });
    expect(draft()).toBe("half-typed reply");
  });

  it("posting a comment with `entity` passed from EntityProvider's context doesn't reset the section", async () => {
    const { useSection, ThemeContext } = await loadHook(variant);
    const { listCalls } = mockApi();
    const { Probe, counts, section } = makeProbe(ThemeContext);
    const Providers = makeProviders();

    function Section() {
      const { entity } = useEntity();
      const { CommentSectionProvider, providerProps } = useSection({ entity });
      return (
        <CommentSectionProvider {...providerProps}>
          <Probe />
        </CommentSectionProvider>
      );
    }
    function EntityHolder({ children }: { children: React.ReactNode }) {
      const [current, setCurrent] = useState<Entity | null | undefined>(
        makeEntity({ id: "entity-A", commentsCount: 1 }),
      );
      return (
        <EntityContext.Provider value={{ entity: current, setEntity: setCurrent }}>
          {children}
        </EntityContext.Provider>
      );
    }

    const view = render(
      <EntityHolder>
        <Section />
      </EntityHolder>,
      { wrapper: Providers },
    );
    await waitFor(() => expect(view.getByTestId("ids").textContent).toBe(A1));
    fireEvent.change(view.getByLabelText("draft"), { target: { value: "half-typed reply" } });

    await act(async () => {
      await section().createComment!({ content: "hello" });
    });
    await new Promise((r) => setTimeout(r, 30));

    expect(view.getByTestId("count").textContent).toBe("2");
    expect(counts).toEqual({ mounts: 1, unmounts: 0 });
    expect((view.getByLabelText("draft") as HTMLInputElement).value).toBe("half-typed reply");
    expect(view.getByTestId("ids").textContent).toContain(A1);
    expect(view.getByTestId("ids").textContent).toContain(NEW);
    expect(listCalls()).toHaveLength(1);
  });

  it("sends `createIfNotFound` with the entity lookup only when the section component is given it", async () => {
    const { loadSection } = await loadHook(variant);
    const Section = await loadSection();
    const { lookups, listCalls } = mockApi();
    const Providers = makeProviders();

    // Without the prop the section only looks the entity up.
    const view = render(<Section foreignId="article-1" />, { wrapper: Providers });
    await waitFor(() => expect(lookups()).toHaveLength(1));
    expect(lookups()[0].foreignId).toBe("article-1");
    expect(lookups()[0].createIfNotFound).toBeUndefined();
    await new Promise((r) => setTimeout(r, 30));
    expect(listCalls()).toHaveLength(0);

    // Turning it on reaches the mounted section: a new lookup that creates.
    view.rerender(<Section foreignId="article-1" createIfNotFound />);
    await waitFor(() => expect(lookups()).toHaveLength(2));
    expect(lookups()[1]).toMatchObject({ foreignId: "article-1", createIfNotFound: true });
    await waitFor(() => expect(listCalls()).toHaveLength(1));
    view.unmount();

    // Given from the start.
    render(<Section foreignId="article-2" createIfNotFound />, { wrapper: Providers });
    await waitFor(() => expect(lookups()).toHaveLength(3));
    expect(lookups()[2]).toMatchObject({ foreignId: "article-2", createIfNotFound: true });
  });
});
