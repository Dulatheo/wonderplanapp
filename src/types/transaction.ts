export type Transaction = {
  id: string;
  type: 'create' | 'delete' | 'update'; // Simplified types
  entityType: string; // 'context' | 'task' | future entities
  entityId: string;
  payload: string;
  status: 'pending' | 'committed' | 'failed';
  retries: number;
  createdAt: number;
};
