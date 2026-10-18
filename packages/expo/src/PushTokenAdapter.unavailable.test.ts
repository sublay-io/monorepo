import { describe, it, expect, vi } from "vitest";

// Expo Go: expo-notifications can't load (a native module it needs isn't in
// Expo Go), and the error surfaces when the module is first loaded.
vi.mock("expo-notifications", () => {
  throw new Error("Cannot find native module 'ExpoTopicSubscriptionModule'");
});

const handleError = vi.fn();
vi.mock("@sublay/core", () => ({ handleError: (...args: unknown[]) => handleError(...args) }));

import { expoPushTokenAdapter } from "./PushTokenAdapter";

describe("expoPushTokenAdapter where expo-notifications can't load (Expo Go)", () => {
  it("loads with @sublay/expo without touching expo-notifications", () => {
    // Importing the adapter above did not throw: the module loads on first use
    expect(expoPushTokenAdapter.requestPermission).toBeTypeOf("function");
  });

  it("rejects the push calls instead of crashing", async () => {
    await expect(expoPushTokenAdapter.requestPermission()).rejects.toThrow();
    await expect(expoPushTokenAdapter.hasPermission!()).rejects.toThrow();
    await expect(
      expoPushTokenAdapter.getDeviceIdentifier({ projectId: "p1" }),
    ).rejects.toThrow();
  });

  it("never throws from subscribeToIdentifierChanges, which core calls while mounting", async () => {
    const unsubscribe = expoPushTokenAdapter.subscribeToIdentifierChanges!(
      { projectId: "p1" },
      () => {},
    );
    expect(() => unsubscribe()).not.toThrow();
    await vi.waitFor(() => expect(handleError).toHaveBeenCalled());
  });
});
