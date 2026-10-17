// 🔑 The Giphy API key that turns on GIFs, read from your environment.
// Without a key, the GIF button shows only in development, and clicking it
// says what to set. `sublay add` wrote this file for Vite; to use another
// variable name, change it in the first two lines.
export const GIPHY_API_KEY_NAME = "VITE_GIPHY_API_KEY";
export const giphyApiKey: string | undefined = import.meta.env.VITE_GIPHY_API_KEY;
export const isDevelopment: boolean = import.meta.env.DEV;
