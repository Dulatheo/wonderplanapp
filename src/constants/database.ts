export const DB_TABLES = {
  TRANSACTIONS: 'transactions',
  TASKS: 'tasks',
  CONTEXTS: 'contexts',
  PROJECTS: 'projects',
  CONTEXTS_TASKS: 'contexts_tasks',
} as const;

export const DB_ENTITY_TYPES = {
  TASK: 'tasks',
  CONTEXT: 'contexts',
  PROJECT: 'projects',
  CONTEXTS_TASKS: 'contexts_tasks',
} as const;

export type EntityType = (typeof DB_ENTITY_TYPES)[keyof typeof DB_ENTITY_TYPES];
