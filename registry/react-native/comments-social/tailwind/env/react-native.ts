// 🔑 The Giphy API key that turns on GIFs, read from your environment.
// Without a key, the GIF button shows only in development, and clicking it
// says what to set. `sublay add` wrote this file for React Native; to use another
// variable name, change it in the two `export` lines that name it.
// React Native has no built-in way to read environment variables: set the
// key here, or read it with the library your app uses for that.
export const GIPHY_API_KEY_NAME = "GIPHY_API_KEY";
export const giphyApiKey: string | undefined = undefined;
export const isDevelopment: boolean = __DEV__;
