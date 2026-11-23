export interface Rule {
  id: string;
  spaceId: string;
  title: string;
  description: string | null;
  order: number;
  lastApprovedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
