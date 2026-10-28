// `@sublay/expo/push` for tools that don't read the `exports` map in
// package.json (Metro with package exports turned off, the default before
// React Native 0.79, and older bundlers). Everything else resolves the
// subpath through `exports`.
module.exports = require("./dist/push.js");
