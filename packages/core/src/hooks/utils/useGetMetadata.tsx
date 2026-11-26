import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { isAbsoluteUrl } from "../../utils/isAbsoluteUrl";
import { UrlMetadata } from "../../interfaces/UrlMetadata";
import { SublayError } from "../../errors/SublayError";

export interface GetMetadataProps {
  url: string;
}

function useGetMetadata(): (props: GetMetadataProps) => Promise<UrlMetadata> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const getMetadata = useCallback(
    async ({ url }: GetMetadataProps): Promise<UrlMetadata> => {
      if (!projectId) {
        throw new SublayError("No project specified");
      }

      if (!url) {
        throw new SublayError("Please specify a URL");
      }

      const isAbsolute = isAbsoluteUrl(url);

      if (!isAbsolute) {
        throw new SublayError("Please provide an absolute URL");
      }

      const response = await axios.get<UrlMetadata>(
        `/${projectId}/utils/get-metadata`,
        {
          params: {
            url,
          },
        }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return getMetadata;
}

export default useGetMetadata;
