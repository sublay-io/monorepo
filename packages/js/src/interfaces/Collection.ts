export interface Collection {
  id: string;
  projectId: string;
  userId: string;
  parentId: string | null;
  name: string;
  /**
   * How many saved entities the viewer can currently see in the collection,
   * computed on every read: deleted, moderator-removed and draft entities, and
   * entities in a space the viewer can't read, aren't counted (they stay
   * saved). Always equals the `totalItems` of the collection's entities list.
   */
  entityCount: number;
  createdAt: string;
  updatedAt: string;
}
