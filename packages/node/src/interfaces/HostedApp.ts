export interface HostedApp {
  id: string;
  projectId: string;
  name: string;
  type: "discord-board";
  subdomain: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
