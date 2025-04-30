export type LocalTask = {
  id: string;
  name: string;
  context_id?: string;
  priority: 1 | 2 | 3 | 4;
  status: 'pending' | 'synced' | 'deleted';
  server_id?: string;
  created_at: number;
  version: number;
};
