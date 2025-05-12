export type PriorityLevel = 'low' | 'important' | 'high' | 'urgent';
export type PriorityValue = 1 | 2 | 3 | 4;

export const PRIORITY_MAP = {
  urgent: {label: 'Urgent', value: 1, color: '#4d0000'},
  high: {label: 'High', value: 2, color: '#FF5722'},
  important: {label: 'Important', value: 3, color: '#FFC107'},
  low: {label: 'Low', value: 4, color: '#4CAF50'},
} as const;

export const getPriorityByValue = (value: PriorityValue) => {
  return (
    Object.values(PRIORITY_MAP).find(p => p.value === value) || PRIORITY_MAP.low
  );
};

export type LocalTask = {
  id: string; // Local UUID
  name: string;
  priority: PriorityValue; // 1-4
  status: 'pending' | 'synced' | 'deleted';
  server_id?: string; // Amplify ID after sync
  project_id?: string; // Local project ID (optional)
  created_at: number; // Unix timestamp
  version: number; // For conflict resolution
};

export type LocalTaskWithDetails = LocalTask & {
  context_names?: string;
  project_name?: string;
};
