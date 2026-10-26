import type {
  PushDevicePlatform,
  PushWebSubscriptionPayload,
} from "../PushTokenAdapter";

// A registered push device, as returned by POST /push-notifications/devices.
export interface PushDevice {
  id: string;
  userId: string;
  platform: PushDevicePlatform;
  payload: string | PushWebSubscriptionPayload; // token for ios/android, subscription for web
  deviceKey: string; // the token for ios/android, the subscription endpoint for web
  createdAt: string;
  updatedAt: string;
}
