export type LocalContextTask = {
  id: string; // Local UUID
  local_context_id: string; // Local context ID
  local_task_id: string; // Local task ID
  server_id?: string; // Amplify association ID
  server_context_id?: string;
  server_task_id?: string;
  status: 'pending' | 'synced' | 'deleted';
  created_at: number; // Unix timestamp
  version: number; // For conflict resolution
};
