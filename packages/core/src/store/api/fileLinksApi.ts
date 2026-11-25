import { baseApi } from "./baseApi";
import type { File as SublayFile } from "../../interfaces/models/File";

/** `POST /files/links` (S#144): fresh links for files the viewer can see. */
export const fileLinksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    refreshFileLinks: builder.mutation<
      { files: SublayFile[] },
      { projectId: string; fileIds: string[] }
    >({
      query: ({ projectId, fileIds }) => ({
        url: `/${projectId}/files/links`,
        method: "POST",
        body: { fileIds },
      }),
    }),
  }),
});

export const { useRefreshFileLinksMutation } = fileLinksApi;
