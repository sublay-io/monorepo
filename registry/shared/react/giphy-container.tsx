import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import MagnifyingGlassIcon from "./magnifying-glass-icon";
import { type UITheme, uiColor } from "./theme";

function GiphyContainer({
  onClickBack,
  onSelectGif,
  giphyApiKey,
  visible,
  theme = "light",
  fullScreen = false,
}: {
  onClickBack: () => void;
  onSelectGif: (selectedGif: {
    id: string;
    url: string;
    gifUrl: string;
    gifPreviewUrl: string;
    // The API's GifData requires both of these as strings, and rejects the
    // payload otherwise — so emit the shape the server accepts.
    altText: string;
    aspectRatio: string;
  }) => void;
  giphyApiKey: string;
  visible: boolean; // Determines if the component is visible or not
  theme?: UITheme; // Colors to draw with (default: light)
  // Cover the whole viewport instead of the nearest positioned ancestor (default: false)
  fullScreen?: boolean;
}) {
  const gridParentRef = useRef<HTMLDivElement>(null);
  const [parentWidth, setParentWidth] = useState<number>(0);
  const [query, setQuery] = useState<string>(""); // Current search query
  const [debouncedQuery, setDebouncedQuery] = useState<string>(""); // Debounced query

  const gf = useMemo(() => new GiphyFetch(giphyApiKey), [giphyApiKey]);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Update parent width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (gridParentRef.current) {
        setParentWidth(gridParentRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // Conditionally fetch Gifs only when visible
  const fetchGifs = useCallback(
    (offset: number) => {
      if (!visible) {
        // Return a valid GifsResult object with empty values
        return Promise.resolve({
          data: [],
          pagination: { total_count: 0, count: 0, offset: 0 }, // Provide complete pagination properties
          meta: { status: 200, msg: "OK", response_id: "" },
        });
      }

      // Fetch  search results if visible

      if (debouncedQuery.trim().length > 0) {
        return gf.search(debouncedQuery, { offset, limit: 10 });
      }

      // Fetch trending
      return gf.trending({ offset, limit: 10 });
    },
    [debouncedQuery, gf, visible]
  );

  useEffect(() => {
    if (!visible) setQuery("");
  }, [visible]);

  // Memoize the Grid component
  const memoizedGrid = useMemo(() => {
    if (parentWidth > 0) {
      return (
        <Grid
          key={`${debouncedQuery}-${visible}`} // Force re-render when visible or query changes
          width={parentWidth}
          columns={2}
          fetchGifs={fetchGifs}
          onGifClick={(gifData, e) => {
            e.preventDefault();
            e.stopPropagation();

            const aspectRatio =
              Number(gifData.images.fixed_width.width) /
              Number(gifData.images.fixed_width.height);

            const selectedGif = {
              id: gifData.id.toString(),
              url: gifData.url,
              gifUrl: gifData.images.fixed_width.url,
              gifPreviewUrl: gifData.images.preview_gif.url,
              // Giphy often has no alt_text, and the API requires a string.
              altText: gifData.alt_text ?? "",
              aspectRatio: String(aspectRatio),
            };
            onSelectGif(selectedGif);
          }}
        />
      );
    }
    return null;
  }, [parentWidth, fetchGifs, debouncedQuery, onSelectGif, visible]);

  return (
    <div
      style={{
        // Full screen: pinned to the viewport. Otherwise: anchored to the
        // bottom of the nearest positioned ancestor (the comment section),
        // covering it up to most of the viewport's height, so the search
        // field stays in view when the section is taller than the screen.
        position: fullScreen ? "fixed" : "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        top: fullScreen ? 0 : "auto",
        opacity: visible ? 1 : 0, // Opacity based on visibility
        backgroundColor: uiColor("surface", theme),
        height: "100%",
        maxHeight: fullScreen ? undefined : "80vh",
        width: "100%",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        overflow: "hidden",
        padding: "0.25rem",
        gap: "0.25rem",
        zIndex: 1000,
        pointerEvents: visible ? "auto" : "none", // Make it unclickable when not visible
        transition: "opacity 0.1s ease", // Smooth fade effect
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          alignItems: "stretch",
        }}
      >
        <button
          onClick={onClickBack}
          style={{
            backgroundColor: uiColor("control", theme),
            borderRadius: "0.5rem",
            width: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: uiColor("muted", theme),
          }}
        >
          ←
        </button>
        <div
          style={{
            width: "100%",
            borderRadius: "0.5rem",
            paddingLeft: 8,
            backgroundColor: uiColor("control", theme),
            display: "flex",
            alignItems: "center",
            flex: 1,
          }}
        >
          {/* The icon takes its color from this wrapper: a CSS variable does
              not work in an SVG presentation attribute. */}
          <div className="pt-1" style={{ color: uiColor("muted", theme) }}>
            <MagnifyingGlassIcon width={14} color="currentColor" />
          </div>

          <input
            type="text"
            placeholder="Search GIPHY"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              boxSizing: "border-box",
              backgroundColor: "transparent",
              color: uiColor("text", theme),
              fontSize: 13,
              outline: "none", // Removes the default focus outline
              boxShadow: "none", // Removes any focus ring or shadow
            }}
          />
        </div>
      </div>
      <div
        ref={gridParentRef}
        style={{
          flex: 1,
          height: "100%",
          width: "100%",
          overflowY: "scroll",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {memoizedGrid}
      </div>
    </div>
  );
}

export default GiphyContainer;
