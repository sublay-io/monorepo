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

export interface FetchManyRulesResponse {
  data: Rule[];
  count: number;
}
