import axios, { AxiosInstance } from "axios";

export interface ClientConfig {
  projectId: string;
  apiKey: string;
  isInternal?: boolean;
}

export class SublayHttpClient {
  projectInstance: AxiosInstance;
  internalInstance: AxiosInstance;
  baseInstance: AxiosInstance;

  constructor({ projectId, apiKey, isInternal }: ClientConfig) {
    // v8 reads the project from the URL path only and refuses a project-id
    // header, so the project instance sends none.
    this.projectInstance = axios.create({
      baseURL: `https://api.sublay.io/v8/${projectId}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(isInternal && { "X-Sublay-Internal": "true" }),
      },
    });

    // `/internal` is outside the v8 chain and reads the project from this
    // header (there is no project in its path), so it keeps it.
    this.internalInstance = axios.create({
      baseURL: "https://api.sublay.io/internal",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Sublay-Project-ID": projectId,
        ...(isInternal && { "X-Sublay-Internal": "true" }),
      },
    });

    this.baseInstance = axios.create({
      baseURL: "https://api.sublay.io",
    });
  }
}
