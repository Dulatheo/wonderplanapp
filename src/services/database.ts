// src/services/database.ts
import SQLite from 'react-native-sqlite-storage';
import {Alert} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {LocalContext} from '../types/context';
import {Transaction} from '../types/transaction';
import {contextApi} from './api';

const db = SQLite.openDatabase(
  {name: 'todo.db', location: 'default'},
  () => console.log('Database opened'),
  error => console.error('Database error:', error),
);

let isDbInitialized = false;
let isOnline = true;

export const setOnlineStatus = (status: boolean) => {
  isOnline = status;
};

export const initializeDatabase = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await new Promise<void>((resolveTx, rejectTx) => {
        db.transaction(tx => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS contexts (
              id TEXT PRIMARY KEY,
              name TEXT, // Removed UNIQUE constraint
              status TEXT DEFAULT 'pending',
              server_id TEXT,
              created_at INTEGER,
              version INTEGER DEFAULT 1
            );`,
          );

          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS tasks (
              id TEXT PRIMARY KEY,
              context_id TEXT,
              name TEXT,
              priority INTEGER DEFAULT 4,
              status TEXT DEFAULT 'pending',
              server_id TEXT,
              created_at INTEGER,
              version INTEGER DEFAULT 1,
              FOREIGN KEY(context_id) REFERENCES contexts(id) ON DELETE SET NULL
            );`,
          );

          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS transactions (
              id TEXT PRIMARY KEY,
              type TEXT,
              entityType TEXT,
              entityId TEXT,
              payload TEXT,
              status TEXT DEFAULT 'pending',
              retries INTEGER DEFAULT 0,
              createdAt INTEGER
            );`,
          );

          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions (status)',
          );

          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_tx_retries ON transactions (retries)',
          );

          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_tasks_context ON tasks (context_id) WHERE context_id IS NOT NULL',
          );

          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_contexts_name ON contexts (name)',
            [],
            () => resolveTx(), // Success callback
            (_, error) => rejectTx(error), // Error callback
          );
        });
      });

      isDbInitialized = true;
      setupNetworkListener();
      resolve();
    } catch (error) {
      console.error('Database initialization failed:', error);
      reject(error);
    }
  });
};

const setupNetworkListener = () => {
  NetInfo.addEventListener(state => {
    isOnline = state.isConnected ?? false;
    if (isOnline && isDbInitialized) {
      processTransactions();
    }
  });
};

export const performInitialSync = async (): Promise<void> => {
  try {
    const {data: remoteItems} = await contextApi.listContexts();
    const localItems = await getContexts();

    db.transaction(tx => {
      // Update or insert remote items
      remoteItems.forEach(remoteItem => {
        const existingLocal = localItems.find(
          local => local.server_id === remoteItem.id,
        );

        if (existingLocal) {
          tx.executeSql(
            `UPDATE contexts SET 
              content = ?, 
              version = ? 
             WHERE server_id = ?`,
            [remoteItem.name, existingLocal.version + 1, remoteItem.id],
          );
        } else {
          tx.executeSql(
            `INSERT OR IGNORE INTO contexts 
            (id, content, status, server_id, created_at, version) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
              `server_${remoteItem.id}`,
              remoteItem.name,
              'synced',
              remoteItem.id,
              new Date(remoteItem.createdAt).getTime(),
              1,
            ],
          );
        }
      });

      // Preserve local unsynced items
      localItems.forEach(localItem => {
        if (!localItem.server_id) {
          tx.executeSql(
            `INSERT OR IGNORE INTO contexts 
            (id, content, status, created_at, version)
            VALUES (?, ?, ?, ?, ?)`,
            [
              localItem.id,
              localItem.name,
              localItem.status,
              localItem.created_at,
              localItem.version,
            ],
          );
        }
      });
    });
  } catch (error) {
    console.error('Initial sync failed:', error);
    throw error;
  }
};

export const getContexts = async (): Promise<LocalContext[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM contexts WHERE status != "deleted" ORDER BY created_at DESC',
        [],
        (_, result) => resolve(result.rows.raw()),
        (_, error) => reject(error),
      );
    });
  });
};

export const createTodoTransaction = async (
  content: string,
): Promise<string> => {
  const todoId = `local_${Date.now()}`;
  const txId = `tx_${Date.now()}`;

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          `INSERT INTO transactions 
          (id, type, entityType, entityId, payload, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            txId,
            'create',
            'todo',
            todoId,
            JSON.stringify({content}),
            Date.now(),
          ],
        );

        tx.executeSql(
          `INSERT INTO contexts 
          (id, content, status, created_at) 
          VALUES (?, ?, ?, ?)`,
          [todoId, content, 'pending', Date.now()],
        );
      },
      error => reject(error),
      () => resolve(),
    );
  });

  return txId;
};

export const deleteTodoTransaction = async (
  item: LocalContext,
): Promise<string> => {
  const txId = `tx_${Date.now()}`;

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          `INSERT INTO transactions 
          (id, type, entityType, entityId, payload, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            txId,
            'delete',
            'todo',
            item.id,
            JSON.stringify({serverId: item.server_id}),
            Date.now(),
          ],
        );

        tx.executeSql(`UPDATE contexts SET status = 'deleted' WHERE id = ?`, [
          item.id,
        ]);
      },
      error => reject(error),
      () => resolve(),
    );
  });

  return txId;
};

// Sync processor
export const processTransactions = async () => {
  if (!isOnline || !isDbInitialized) return;

  const transactions = await new Promise<Transaction[]>(resolve => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM transactions 
          WHERE status = 'pending' 
            AND retries < 3 
          ORDER BY createdAt 
          LIMIT 50`,
        [],
        (_, result) => resolve(result.rows.raw()),
      );
    });
  });

  for (const tx of transactions) {
    try {
      const payload = JSON.parse(tx.payload);

      switch (tx.type) {
        case 'create': {
          const {data: serverTodo} = await contextApi.createContext(
            payload.content,
          );

          if (!serverTodo) {
            throw new Error('Failed to create Todo on server');
          }

          await new Promise<void>(resolve => {
            db.transaction(sqlTx => {
              // Update transaction status
              sqlTx.executeSql(
                `UPDATE transactions SET status = 'committed' WHERE id = ?`,
                [tx.id],
              );

              // Update local todo with server ID
              sqlTx.executeSql(
                `UPDATE contexts 
                  SET server_id = ?, status = 'synced', version = version + 1 
                  WHERE id = ?`,
                [serverTodo.id, tx.entityId],
              );

              resolve();
            });
          });
          break;
        }

        case 'delete': {
          if (payload.serverId) {
            await contextApi.deleteContext(payload.serverId);
          }

          await new Promise<void>(resolve => {
            db.transaction(sqlTx => {
              // Remove transaction and todo
              sqlTx.executeSql(`DELETE FROM transactions WHERE id = ?`, [
                tx.id,
              ]);
              sqlTx.executeSql(`DELETE FROM contexts WHERE id = ?`, [
                tx.entityId,
              ]);
              resolve();
            });
          });
          break;
        }
      }
    } catch (error) {
      console.error(`Transaction ${tx.id} failed:`, error);
      await new Promise<void>(resolve => {
        db.transaction(sqlTx => {
          sqlTx.executeSql(
            `UPDATE transactions 
              SET retries = retries + 1 
              WHERE id = ?`,
            [tx.id],
          );
          resolve();
        });
      });
    }
  }
};
