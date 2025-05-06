// src/services/database.ts
import SQLite from 'react-native-sqlite-storage';
import {Alert} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {Transaction} from '../types/transaction';
import {contextApi} from './api';
import {queryClient} from './queryClient';
import {getContexts} from './database/contextDb';
import {TransactionProcessor} from './sync/TransactionProcessor';
import {tables, indexes} from './database/schemas';

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
