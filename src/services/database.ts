// src/services/database.ts
import SQLite from 'react-native-sqlite-storage';
import {Alert} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {Transaction} from '../types/transaction';
import {contextApi} from './api';
import {queryClient} from './queryClient';
import {getContexts} from './database/contextDb';
import {TransactionProcessor} from './sync/TransactionProcessor';

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
  return new Promise(async (resolve, reject) => {
    try {
      await new Promise<void>((resolveTx, rejectTx) => {
        db.transaction(tx => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS contexts (
              id TEXT PRIMARY KEY,
              name TEXT,
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
      proccessTransaction();
    }
  });
};

const proccessTransaction = async () => {
  await processor.processPendingTransactions();
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
              name = ?, 
              version = ? 
             WHERE server_id = ?`,
            [remoteItem.name, existingLocal.version + 1, remoteItem.id],
          );
        } else {
          tx.executeSql(
            `INSERT OR IGNORE INTO contexts 
            (id, name, status, server_id, created_at, version) 
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
            (id, name, status, created_at, version)
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

// Sync processor
// export const processTransactions = async () => {
//   if (!isOnline || !isDbInitialized) return;

//   const transactions = await new Promise<Transaction[]>(resolve => {
//     db.transaction(tx => {
//       tx.executeSql(
//         `SELECT * FROM transactions
//           WHERE status = 'pending'
//           AND retries < 3
//           ORDER BY createdAt
//           LIMIT 50`,
//         [],
//         (_, result) => resolve(result.rows.raw()),
//       );
//     });
//   });

//   for (const tx of transactions) {
//     try {
//       const payload = JSON.parse(tx.payload);
//       switch (tx.type) {
//         case 'create': {
//           const {data: serverContext} = await contextApi.createContext(
//             payload.name,
//           );

//           if (!serverContext) {
//             throw new Error('Failed to create Context on server');
//           }

//           await new Promise<void>(resolve => {
//             db.transaction(sqlTx => {
//               sqlTx.executeSql(
//                 `UPDATE transactions SET status = 'committed' WHERE id = ?`,
//                 [tx.id],
//               );

//               sqlTx.executeSql(
//                 `UPDATE contexts
//                   SET server_id = ?, status = 'synced', version = version + 1
//                   WHERE id = ?`,
//                 [serverContext.id, tx.entityId],
//               );

//               resolve();
//             });
//           });
//           break;
//         }

//         case 'delete': {
//           if (payload.serverId) {
//             await contextApi.deleteContext(payload.serverId);
//           }

//           await new Promise<void>(resolve => {
//             db.transaction(sqlTx => {
//               sqlTx.executeSql(`DELETE FROM transactions WHERE id = ?`, [
//                 tx.id,
//               ]);
//               sqlTx.executeSql(`DELETE FROM contexts WHERE id = ?`, [
//                 tx.entityId,
//               ]);
//               resolve();
//             });
//           });
//           break;
//         }
//       }
//       queryClient.invalidateQueries({queryKey: ['contexts']});
//     } catch (error) {
//       console.error(`Transaction ${tx.id} failed:`, error);
//       await new Promise<void>(resolve => {
//         db.transaction(sqlTx => {
//           sqlTx.executeSql(
//             `UPDATE transactions
//               SET retries = retries + 1
//               WHERE id = ?`,
//             [tx.id],
//           );
//           resolve();
//         });
//       });
//     }
//   }
// };
