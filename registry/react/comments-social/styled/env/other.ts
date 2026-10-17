// 🔑 The Giphy API key that turns on GIFs, read from your environment.
// Without a key, the GIF button shows only in development, and clicking it
// says what to set. `sublay add` wrote this file for a framework it didn't recognise; to use another
// variable name, change it in the two `export` lines that name it.
// Nothing is read yet: replace `undefined` with your framework's way of
// reading the variable, and set isDevelopment from its development flag.
export const GIPHY_API_KEY_NAME = "GIPHY_API_KEY";
export const giphyApiKey: string | undefined = undefined;
export const isDevelopment: boolean = true;
