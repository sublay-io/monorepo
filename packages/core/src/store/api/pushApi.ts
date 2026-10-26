import { baseApi } from "./baseApi";
import type { PushDeviceIdentifier } from "../../interfaces/PushTokenAdapter";
import type { PushDevice } from "../../interfaces/models/PushDevice";

type PushDeviceMutationParams = PushDeviceIdentifier & { projectId: string };

export const pushApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerPushDevice: builder.mutation<PushDevice, PushDeviceMutationParams>({
      query: ({ projectId, ...body }) => ({
        url: `/${projectId}/push-notifications/devices`,
        method: "POST",
        body,
      }),
    }),

    // A POST, not a DELETE: the device token travels in the body, never in a
    // URL (which gets logged).
    deregisterPushDevice: builder.mutation<void, PushDeviceMutationParams>({
      query: ({ projectId, ...body }) => ({
        url: `/${projectId}/push-notifications/devices/deregister`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useRegisterPushDeviceMutation, useDeregisterPushDeviceMutation } = pushApi;

export const { registerPushDevice, deregisterPushDevice } = pushApi.endpoints;
