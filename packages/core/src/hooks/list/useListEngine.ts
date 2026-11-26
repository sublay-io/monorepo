import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";
import {
  ListLoaderValues,
  ListPage,
  UseListLoaderOptions,
  useListLoader,
} from "./useListLoader";

export interface UseListEngineOptions<TItem, TCursor>
  extends Omit<UseListLoaderOptions<TItem, TCursor>, "onPage"> {
  /**
   * When given, an appended page skips items already loaded (by this key).
   * Left out: pages are appended as they come.
   */
  getKey?: (item: TItem) => string;
  /**
   * Called with every page that lands, after its items are stored (e.g. to
   * keep a page's side data). `onClear`, when given, is called after the
   * items are cleared.
   */
  onPage?: (page: ListPage<TItem, TCursor>, replace: boolean) => void;
}

export interface ListEngineValues<TItem> extends ListLoaderValues {
  items: TItem[];
  setItems: Dispatch<SetStateAction<TItem[]>>;
}

/** {@link useListLoader} with the items kept in local state. */
export function useListEngine<TItem, TCursor>(
  options: UseListEngineOptions<TItem, TCursor>,
): ListEngineValues<TItem> {
  const [items, setItems] = useState<TItem[]>([]);

  const latest = useRef(options);
  latest.current = options;

  const onPage = useCallback((page: ListPage<TItem, TCursor>, replace: boolean) => {
    const { getKey } = latest.current;
    setItems((prev) => {
      if (replace) return page.items;
      if (!getKey) return [...prev, ...page.items];
      const seen = new Set(prev.map(getKey));
      return [...prev, ...page.items.filter((item) => !seen.has(getKey(item)))];
    });
    latest.current.onPage?.(page, replace);
  }, []);

  const onClear = useCallback(() => {
    setItems((prev) => (prev.length === 0 ? prev : []));
    latest.current.onClear?.();
  }, []);

  const loader = useListLoader<TItem, TCursor>({ ...options, onPage, onClear });

  return { items, setItems, ...loader };
}
