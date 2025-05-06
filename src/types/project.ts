export type LocalProject = {
  id: string; // Local UUID
  name: string;
  status: 'pending' | 'synced' | 'deleted';
  server_id?: string; // Amplify ID after sync
  created_at: number; // Unix timestamp
  version: number; // For conflict resolution
};
