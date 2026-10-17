// 🔑 The Giphy API key that turns on GIFs, read from your environment.
// Without a key, the GIF button shows only in development, and clicking it
// says what to set. `sublay add` wrote this file for Expo; to use another
// variable name, change it in the first two lines.
export const GIPHY_API_KEY_NAME = "EXPO_PUBLIC_GIPHY_API_KEY";
export const giphyApiKey: string | undefined = process.env.EXPO_PUBLIC_GIPHY_API_KEY;
export const isDevelopment: boolean = __DEV__;
