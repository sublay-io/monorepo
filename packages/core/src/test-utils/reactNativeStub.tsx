import React from "react";

// Stands in for `react-native` in src/registry/*.test.tsx (aliased in
// vitest.config.ts): the native comment section components lay themselves
// out with these, and this package doesn't depend on `react-native`.
const Box = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;

export const View = Box;
export const ScrollView = Box;
export const Text = Box;
export const TouchableOpacity = Box;
