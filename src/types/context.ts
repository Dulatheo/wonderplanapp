export type LocalContext = {
  id: string;
  name: string;
  status: 'pending' | 'synced' | 'deleted';
  server_id?: string;
  created_at: number;
  version: number;
};
