// 🔑 The Giphy API key that turns on GIFs, read from your environment.
// Without a key, the GIF button shows only in development, and clicking it
// says what to set. `sublay add` wrote this file for Next.js; to use another
// variable name, change it in the two `export` lines that name it.
export const GIPHY_API_KEY_NAME = "NEXT_PUBLIC_GIPHY_API_KEY";
export const giphyApiKey: string | undefined = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
export const isDevelopment: boolean = process.env.NODE_ENV !== "production";
