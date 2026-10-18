import { handleError } from "@sublay/core";
import type { PushTokenAdapter, PushDeviceIdentifier } from "@sublay/core";

type ExpoNotifications = typeof import("expo-notifications");

let notificationsModule: Promise<ExpoNotifications> | null = null;

// expo-notifications is loaded the first time push is used, not together with
// @sublay/expo. Loading it looks up its native modules, and Expo Go doesn't
// ship all of them (push needs a development build): loaded up front, it
// crashed every app on @sublay/expo in Expo Go, including apps that never use
// push. Apps that use push get the same module, a moment later. In Expo Go,
// the push calls below reject instead, which usePushRegistration reports.
function loadNotifications(): Promise<ExpoNotifications> {
  notificationsModule ??= import("expo-notifications");
  return notificationsModule;
}

/** Maps an expo-notifications DevicePushToken onto Sublay's identifier shape. */
function toIdentifier(devicePushToken: {
  type: string;
  data: unknown;
}): PushDeviceIdentifier | null {
  if (devicePushToken.type === "ios" || devicePushToken.type === "android") {
    return {
      platform: devicePushToken.type,
      token: devicePushToken.data as string,
    };
  }
  return null;
}

// Deliberately uses getDevicePushTokenAsync (the raw native APNs/FCM token),
// not getExpoPushTokenAsync (Expo's own push-relay token) — Sublay's server
// dispatches directly to APNs/FCM using the project's own credentials, so it
// needs the token those services recognize, not an Expo-relay token.
export const expoPushTokenAdapter: PushTokenAdapter = {
  async requestPermission(): Promise<boolean> {
    const Notifications = await loadNotifications();
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  },

  // `getPermissionsAsync` READS the current status; only
  // `requestPermissionsAsync` above can prompt. Core uses this to decide
  // whether to do the mount-time identifier read below at all: a device that
  // was never granted notification permission cannot have been registered by
  // `register()`, which stops at `requestPermission()` without a grant, so
  // there is no binding for it to discover and no reason to store its push
  // token — for a binding created by THIS release.
  //
  // ⚠ Core bypasses it exactly once per device, and this is why: revoking
  // notification permission neither invalidates the token nor removes a
  // binding, so a device that registered on an older release and has since
  // turned notifications off still has one, and gating on this would leave it
  // permanently unreachable. See `AccountMap.pushIdentifierProbed`.
  async hasPermission(): Promise<boolean> {
    const Notifications = await loadNotifications();
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  },

  async getDeviceIdentifier(): Promise<PushDeviceIdentifier | null> {
    const Notifications = await loadNotifications();
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    return toIdentifier(devicePushToken);
  },

  // `getDevicePushTokenAsync` registers with APNs/FCM and hands back the token
  // the OS holds. It shows the user nothing: registering for remote
  // notifications and ASKING to display them are separate operations, and the
  // asking is `requestPermissionsAsync`'s job above. Declaring that lets core
  // read the current identifier ONCE ON MOUNT rather than waiting for a
  // rotation, which is the only thing that closes the gap for an install that
  // registered before this SDK persisted identifiers: the listener below is
  // rotation-only, so on a device whose token never rotates it would otherwise
  // emit nothing, and every unbind path (sign-out, account removal, the
  // per-account toggle) stays silently no-op for want of a stored identifier.
  //
  // ⚠ NOT because "a token only exists once permission was granted" — it does
  // not. A device token is issued whether or not the user was ever asked, which
  // is what makes silent push possible, so this read says nothing about consent
  // or about a binding existing. That is precisely why core gates it on
  // `hasPermission` above.
  canReadIdentifierWithoutPrompting: true,

  // Expo is the clean case: `addPushTokenListener` emits exactly the
  // `DevicePushToken` shape `getDevicePushTokenAsync` returns, so the emitted
  // value can be used directly. Subscribing asks the user for nothing — a
  // refreshed token is delivered, not requested.
  //
  // Core calls this synchronously while a screen mounts, so it must never
  // throw: the listener is attached once expo-notifications has loaded, and a
  // failed load (Expo Go) is reported, not thrown.
  subscribeToIdentifierChanges(_context, onChange): () => void {
    let subscription: { remove(): void } | null = null;
    let unsubscribed = false;

    loadNotifications()
      .then((Notifications) => {
        if (unsubscribed) return;
        subscription = Notifications.addPushTokenListener((token) => {
          onChange(toIdentifier(token));
        });
      })
      .catch((error) => {
        handleError(error, "Push notifications are unavailable (expo-notifications didn't load)");
      });

    return () => {
      unsubscribed = true;
      subscription?.remove();
    };
  },
};
