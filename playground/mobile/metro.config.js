const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// This app sits inside the monorepo but is not part of its pnpm workspace: it
// has its own React and React Native versions. Metro only loads files from
// the folders it watches, so watching just this one keeps the workspace's
// copies out; its own node_modules is where it looks first.
config.watchFolders = [__dirname];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];

module.exports = withNativeWind(config, { input: "./global.css" });
