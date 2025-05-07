export const tables = [
  {
    name: 'projects',
    sql: `
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT,
            status TEXT DEFAULT 'pending',
            server_id TEXT,
            created_at INTEGER,
            version INTEGER DEFAULT 1
        );
        `,
  },
  {
    name: 'contexts',
    sql: `
        CREATE TABLE IF NOT EXISTS contexts (
          id TEXT PRIMARY KEY,
          name TEXT,
          status TEXT DEFAULT 'pending',
          server_id TEXT,
          created_at INTEGER,
          version INTEGER DEFAULT 1
        );`,
  },
  {
    name: 'tasks',
    sql: `
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          name TEXT,
          priority INTEGER DEFAULT 4,
          status TEXT DEFAULT 'pending',
          server_id TEXT,
          created_at INTEGER,
          version INTEGER DEFAULT 1,
          FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
        );`,
  },
  {
    name: 'transactions',
    sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          type TEXT,
          entityType TEXT,
          entityId TEXT,
          payload TEXT,
          status TEXT DEFAULT 'pending',
          retries INTEGER DEFAULT 0,
          createdAt INTEGER
        );`,
  },
  {
    name: 'contexts_tasks',
    sql: `
        CREATE TABLE IF NOT EXISTS context_tasks (
          id TEXT PRIMARY KEY,
          local_context_id TEXT NOT NULL,
          local_task_id TEXT NOT NULL,
          server_id TEXT,
          server_context_id TEXT,
          server_task_id TEXT,
          status TEXT NOT NULL, 
          created_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          FOREIGN KEY(local_context_id) REFERENCES contexts(id),
          FOREIGN KEY(local_task_id) REFERENCES tasks(id)
        );
    `,
  },
];

export const indexes = [
  // Contexts indexes
  {
    name: 'idx_contexts_name',
    sql: 'CREATE INDEX IF NOT EXISTS idx_contexts_name ON contexts (name)',
  },
  {
    name: 'idx_contexts_status',
    sql: 'CREATE INDEX IF NOT EXISTS idx_contexts_status ON contexts (status)',
  },

  // Tasks indexes
  {
    name: 'idx_tasks_project',
    sql: 'CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks (project_id)',
  },
  {
    name: 'idx_tasks_status',
    sql: 'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status)',
  },
  {
    name: 'idx_tasks_priority',
    sql: 'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority)',
  },

  // Transactions indexes
  {
    name: 'idx_transactions_status',
    sql: 'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status)',
  },
  {
    name: 'idx_transactions_retries',
    sql: 'CREATE INDEX IF NOT EXISTS idx_transactions_retries ON transactions (retries)',
  },
  {
    name: 'idx_transactions_created',
    sql: 'CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions (createdAt)',
  },

  // Context-Tasks junction table indexes
  {
    name: 'idx_context_tasks_context',
    sql: 'CREATE INDEX IF NOT EXISTS idx_context_tasks_context ON context_tasks (local_context_id)',
  },
  {
    name: 'idx_context_tasks_task',
    sql: 'CREATE INDEX IF NOT EXISTS idx_context_tasks_task ON context_tasks (local_task_id)',
  },
  {
    name: 'idx_context_tasks_status',
    sql: 'CREATE INDEX IF NOT EXISTS idx_context_tasks_status ON context_tasks (status)',
  },

  // Projects indexes
  {
    name: 'idx_projects_name',
    sql: 'CREATE INDEX IF NOT EXISTS idx_projects_name ON projects (name)',
  },
  {
    name: 'idx_projects_status',
    sql: 'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status)',
  },
];
