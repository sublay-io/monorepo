export interface Rule {
  id: string;
  projectId: string;
  spaceId: string;
  title: string;
  description: string | null;
  order: number;
  lastApprovedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeleteRuleResponse {
  message: string;
  deletedRule: {
    id: string;
    title: string;
  };
}
