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
  id: string;
  name: string;
  context_id?: string;
  priority: PriorityValue;
  status: 'pending' | 'synced' | 'deleted';
  server_id?: string;
  created_at: number;
  version: number;
};
