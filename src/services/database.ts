// src/services/database.ts
import SQLite from 'react-native-sqlite-storage';
import {Alert} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {Transaction} from '../types/transaction';
import {contextApi, contextTaskApi, projectApi} from './api';
import {queryClient} from './queryClient';
import {getContexts} from './database/contextDb';
import {TransactionProcessor} from './sync/TransactionProcessor';
import {tables, indexes} from './database/schemas';
import {taskApi} from './api';
import {
  DEPENDENCY_ORDER,
  SyncTableConfig,
  syncConfigs,
} from './sync/SyncConfig';

export const db = SQLite.openDatabase(
  {name: 'todo.db', location: 'default'},
  () => console.log('Database opened'),
  error => console.error('Database error:', error),
);

let isDbInitialized = false;
let isOnline = true;

export const processor = new TransactionProcessor();

export const setOnlineStatus = (status: boolean) => {
  isOnline = status;
};

export const pendingTransactions = {
  async getPendingTransactions(): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            `SELECT * FROM transactions 
             WHERE status = 'pending' AND retries < 3 
             ORDER BY createdAt LIMIT 50`,
            [],
            (_, result) => resolve(result.rows.raw()),
            (_, error) => {
              reject(error);
              return true; // Prevent error propagation
            },
          );
        },
        error => {
          reject(error); // Transaction error handler
        },
      );
    });
  },

  async executeSql(sql: string, params: any[] = []) {
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            sql,
            params,
            (_, result) => resolve(result),
            (_, error) => {
              reject(error);
              return true;
            },
          );
        },
        error => reject(error),
      );
    });
  },
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      db.transaction(
        tx => {
          // Create tables
          tables.forEach(({sql}) => {
            tx.executeSql(sql);
          });

          // Create indexes
          indexes.forEach(({sql}) => {
            tx.executeSql(sql);
          });
        },
        error => {
          reject(error);
        },
        () => {
          resolve();
        },
      );
    });

    isDbInitialized = true;
    setupNetworkListener();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

const setupNetworkListener = () => {
  NetInfo.addEventListener(state => {
    isOnline = state.isConnected ?? false;
    if (isOnline && isDbInitialized) {
      proccessTransaction();
    }
  });
};

const proccessTransaction = async () => {
  await processor.processPendingTransactions();
};

const BATCH_CONFIG = {
  BATCH_SIZE: 50,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
};

type RemoteData = {
  projects: Awaited<ReturnType<typeof projectApi.listProjects>>['data'];
  contexts: Awaited<ReturnType<typeof contextApi.listContexts>>['data'];
  tasks: Awaited<ReturnType<typeof taskApi.listTasks>>['data'];
  context_tasks: Awaited<
    ReturnType<typeof contextTaskApi.listAssociations>
  >['data'];
};

type LocalData = {
  projects: Awaited<ReturnType<typeof getPendingLocalItems>>;
  contexts: Awaited<ReturnType<typeof getPendingLocalItems>>;
  tasks: Awaited<ReturnType<typeof getPendingLocalItems>>;
  context_tasks: Awaited<ReturnType<typeof getPendingLocalItems>>;
};

// 2. Update the performInitialSync function
export const performInitialSync2 = async (): Promise<void> => {
  const dbTransaction = await new Promise<SQLite.Transaction>(resolve => {
    db.transaction(resolve, error => {
      throw new Error(`Transaction error: ${error}`);
    });
  });

  try {
    // Stage 1: Collect all remote data first
    const remoteData: RemoteData = {
      projects: (await projectApi.listProjects()).data,
      contexts: (await contextApi.listContexts()).data,
      tasks: (await taskApi.listTasks()).data,
      context_tasks: (await contextTaskApi.listAssociations()).data,
    };

    // Stage 2: Get all local data
    const localData: LocalData = {
      projects: await getPendingLocalItems('projects'),
      contexts: await getPendingLocalItems('contexts'),
      tasks: await getPendingLocalItems('tasks'),
      context_tasks: await getPendingLocalItems('context_tasks'),
    };

    // Stage 3: Process in dependency order within single transaction
    await new Promise<void>((resolve, reject) => {
      dbTransaction.executeSql(
        'BEGIN TRANSACTION;',
        [],
        () => {
          // Process tables sequentially using for..of
          (async () => {
            try {
              for (const tableName of DEPENDENCY_ORDER) {
                const config = syncConfigs.find(c => c.tableName === tableName);
                if (!config) continue;

                // Type-safe access to data
                const remoteItems = remoteData[tableName as keyof RemoteData];
                const localItems = localData[tableName as keyof LocalData];

                // Process remote items
                const processed = await Promise.all(
                  remoteItems.map(async remoteItem => ({
                    mapped: await config.mapRemoteToLocal(remoteItem),
                    serverId: remoteItem.id,
                  })),
                );

                // Update/Insert logic
                for (const {mapped, serverId} of processed) {
                  const existing = localItems.find(
                    l => l.server_id === serverId,
                  );

                  if (existing) {
                    const setClause = config.updateColumns
                      .map(col => `${col} = ?`)
                      .join(', ');
                    const versionValue = config.versionUpdate
                      ? existing.version + 1
                      : mapped.version;
                    const params = [
                      ...config.updateColumns.map(c => mapped[c]),
                      versionValue,
                      serverId,
                    ];

                    await new Promise<void>((resolve, reject) => {
                      dbTransaction.executeSql(
                        `UPDATE ${tableName} SET ${setClause}, version = ? WHERE server_id = ?`,
                        params,
                        () => resolve(),
                        (_, error) => {
                          reject(error);
                          return true;
                        },
                      );
                    });
                  } else {
                    const placeholders = config.insertColumns
                      .map(() => '?')
                      .join(', ');
                    const params = config.insertColumns.map(c => mapped[c]);

                    await new Promise<void>((resolve, reject) => {
                      dbTransaction.executeSql(
                        `INSERT OR IGNORE INTO ${tableName} (${config.insertColumns.join(
                          ', ',
                        )}) VALUES (${placeholders})`,
                        params,
                        () => resolve(),
                        (_, error) => {
                          reject(error);
                          return true;
                        },
                      );
                    });
                  }
                }

                // Preserve local unsynced items
                for (const localItem of localItems) {
                  if (!localItem.server_id) {
                    const columns = Object.keys(localItem).filter(
                      k => k !== 'server_id',
                    );
                    const placeholders = columns.map(() => '?').join(', ');
                    const params = columns.map(c => localItem[c]);

                    await new Promise<void>((resolve, reject) => {
                      dbTransaction.executeSql(
                        `INSERT OR IGNORE INTO ${tableName} (${columns.join(
                          ', ',
                        )}) VALUES (${placeholders})`,
                        params,
                        () => resolve(),
                        (_, error) => {
                          reject(error);
                          return true;
                        },
                      );
                    });
                  }
                }
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          })();
        },
        error => reject(error),
      );
    });

    // Commit with proper callback handling
    await new Promise<void>((resolve, reject) => {
      dbTransaction.executeSql(
        'COMMIT;',
        [],
        (_, result) => resolve(),
        (_, error) => {
          reject(new Error(`Commit failed: ${error.message}`));
          return true;
        },
      );
    });
  } catch (error) {
    // Rollback with proper callback handling
    await new Promise<void>((resolve, reject) => {
      dbTransaction.executeSql(
        'ROLLBACK;',
        [],
        (_, result) => resolve(),
        (_, error) => {
          reject(new Error(`Rollback failed: ${error.message}`));
          return true;
        },
      );
    });

    console.error('Initial sync failed:', error);
    throw error;
  }
};

export const performInitialSync = async (): Promise<void> => {
  try {
    // Sync in dependency order
    for (const config of syncConfigs) {
      await syncTable(config);
    }
  } catch (error) {
    console.error('Initial sync failed:', error);
    throw error;
  }
};

export async function getLocalItems(tableName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM ${tableName}`,
        [],
        (_, result) => {
          const items: any[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            items.push(result.rows.item(i));
          }
          resolve(items);
        },
        (_, error) => {
          reject(error);
          return false;
        },
      );
    });
  });
}

export async function getPendingLocalItems(tableName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM transactions WHERE entityType = ? AND status = ?`,
        [tableName, 'pending'],
        (_, result) => {
          const items: any[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            items.push(result.rows.item(i));
          }
          resolve(items);
        },
        (_, error) => {
          reject(error);
          return false;
        },
      );
    });
  });
}

async function syncTable(config: SyncTableConfig): Promise<void> {
  const {
    tableName,
    apiList,
    mapRemoteToLocal,
    updateColumns,
    insertColumns,
    versionUpdate = true,
  } = config;

  try {
    const {data: remoteItems} = await apiList();
    const localItems = await getLocalItems(tableName);

    const processedRemoteItems = await Promise.all(
      remoteItems.map(async (remoteItem: any) => ({
        mapped: await mapRemoteToLocal(remoteItem),
        serverId: remoteItem.id,
      })),
    );

    await new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        try {
          // Process remote items
          processedRemoteItems.forEach(({mapped, serverId}) => {
            const existing = localItems.find(l => l.server_id === serverId);

            if (existing) {
              const setClause = updateColumns
                .map(col => `${col} = ?`)
                .join(', ');
              const versionValue = versionUpdate
                ? existing.version + 1
                : mapped.version;
              const params = [
                ...updateColumns.map(c => mapped[c]),
                versionValue,
                serverId,
              ];

              tx.executeSql(
                `UPDATE ${tableName} SET ${setClause}, version = ? WHERE server_id = ?`,
                params,
              );
            } else {
              const placeholders = insertColumns.map(() => '?').join(', ');
              const params = insertColumns.map(c => mapped[c]);

              tx.executeSql(
                `INSERT OR IGNORE INTO ${tableName} (${insertColumns.join(
                  ', ',
                )}) VALUES (${placeholders})`,
                params,
              );
            }
          });

          // Preserve local unsynced items
          localItems.forEach(localItem => {
            if (!localItem.server_id) {
              const columns = Object.keys(localItem).filter(
                k => k !== 'server_id',
              );
              const placeholders = columns.map(() => '?').join(', ');
              const params = columns.map(c => localItem[c]);

              tx.executeSql(
                `INSERT OR IGNORE INTO ${tableName} (${columns.join(
                  ', ',
                )}) VALUES (${placeholders})`,
                params,
              );
            }
          });

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Sync failed for ${tableName}:`, error);
    throw error;
  }
}
