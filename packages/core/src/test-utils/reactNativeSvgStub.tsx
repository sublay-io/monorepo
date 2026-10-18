import React from "react";

// Stands in for `react-native-svg` in src/registry/*.test.tsx (aliased in
// vitest.config.ts): the native comment sections draw icons with it.
const Shape = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>;

export const Path = Shape;
export default Shape;
