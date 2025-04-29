/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';

import {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';

import {Amplify} from 'aws-amplify';
import outputs from './amplify_outputs.json';

import type {Schema} from './amplify/data/resource';
import {generateClient} from 'aws-amplify/data';
import SQLite from 'react-native-sqlite-storage';
import NetInfo from '@react-native-community/netinfo';

let isDbInitialized = false;
let isOnline = true;

// Initialize Amplify
const client = generateClient<Schema>();
Amplify.configure(outputs);

// SQLite database setup
const db = SQLite.openDatabase(
  {name: 'todo.db', location: 'default'},
  () => console.log('Database opened'),
  error => console.error('Database error:', error),
);

// Type definitions
type Transaction = {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'todo';
  entityId: string;
  payload: string;
  status: 'pending' | 'committed' | 'failed';
  retries: number;
  createdAt: number;
};

type LocalTodo = {
  id: string;
  content: string;
  status: 'pending' | 'synced' | 'deleted';
  server_id?: string;
  created_at: number;
  version: number;
};

// Initialize database table
const initializeDatabase = async () => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      await new Promise<void>((resolveTx, rejectTx) => {
        db.transaction(tx => {
          // Todos table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS todos (
              id TEXT PRIMARY KEY,
              content TEXT,
              status TEXT DEFAULT 'pending',
              server_id TEXT,
              created_at INTEGER,
              version INTEGER DEFAULT 1
            );`,
          );

          // Transactions table
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

          // Indexes
          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions (status)',
          );
          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_tx_retries ON transactions (retries)',
          );

          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_todos_status ON todos (status)',
            [],
            () => resolveTx(),
            (_, error) => rejectTx(error),
          );
        });
      });

      isDbInitialized = true;
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

// Update the performInitialSync function
const performInitialSync = async () => {
  try {
    // Fetch latest data from Amplify
    const {data: remoteItems} = await client.models.Todo.list();

    // Get existing local items
    const localItems = await new Promise<LocalTodo[]>(resolve => {
      db.transaction(tx => {
        tx.executeSql('SELECT * FROM todos', [], (_, result) =>
          resolve(result.rows.raw()),
        );
      });
    });

    // Merge strategy: Server wins for existing items, preserve local pending changes
    db.transaction(tx => {
      // Update or insert remote items
      remoteItems.forEach(remoteItem => {
        // Check if we have a local copy that's already synced
        const existingLocal = localItems.find(
          local => local.server_id === remoteItem.id,
        );

        if (existingLocal) {
          // Update existing synced items with server data
          tx.executeSql(
            `UPDATE todos SET 
              content = ?, 
              version = ? 
             WHERE server_id = ?`,
            [remoteItem.content, existingLocal.version + 1, remoteItem.id],
          );
        } else {
          // Insert new items from server
          tx.executeSql(
            `INSERT OR IGNORE INTO todos 
            (id, content, status, server_id, created_at, version) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
              `server_${remoteItem.id}`, // Separate ID namespace
              remoteItem.content,
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
            `INSERT OR IGNORE INTO todos 
            (id, content, status, created_at, version)
            VALUES (?, ?, ?, ?, ?)`,
            [
              localItem.id,
              localItem.content,
              localItem.status,
              localItem.created_at,
              localItem.version,
            ],
          );
        }
      });
    });

    queryClient.invalidateQueries({queryKey: ['todos']});
  } catch (error) {
    console.error('Initial sync failed:', error);
  }
};

// Transactional operations
const createTodoTransaction = async (content: string): Promise<string> => {
  const todoId = `local_${Date.now()}`;
  const txId = `tx_${Date.now()}`;

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      tx => {
        // Insert transaction
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

        // Insert todo
        tx.executeSql(
          `INSERT INTO todos 
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

const deleteTodoTransaction = async (item: LocalTodo): Promise<string> => {
  const txId = `tx_${Date.now()}`;

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      tx => {
        // Insert transaction
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

        // Mark todo as deleted
        tx.executeSql(`UPDATE todos SET status = 'deleted' WHERE id = ?`, [
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
const processTransactions = async () => {
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
          const {data: serverTodo} = await client.models.Todo.create({
            content: payload.content,
          });

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
                `UPDATE todos 
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
            await client.models.Todo.delete({id: payload.serverId});
          }

          await new Promise<void>(resolve => {
            db.transaction(sqlTx => {
              // Remove transaction and todo
              sqlTx.executeSql(`DELETE FROM transactions WHERE id = ?`, [
                tx.id,
              ]);
              sqlTx.executeSql(`DELETE FROM todos WHERE id = ?`, [tx.entityId]);
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

// Query Client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const MainApp = () => {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();

  // Load todos from local DB
  const {data: todos = []} = useQuery<LocalTodo[]>({
    queryKey: ['todos'],
    queryFn: () =>
      new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM todos WHERE status != "deleted" ORDER BY created_at DESC',
            [],
            (_, result) => resolve(result.rows.raw()),
            (_, error) => reject(error),
          );
        });
      }),
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: createTodoTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['todos']});
      processTransactions();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTodoTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['todos']});
      processTransactions();
    },
  });

  // Network handling
  useEffect(() => {
    let unsubscribe: () => void;

    const init = async () => {
      try {
        await initializeDatabase();
        // Initial data sync from Amplify
        await performInitialSync();

        // Process any local changes
        await processTransactions();

        // Setup network listener
        unsubscribe = NetInfo.addEventListener(state => {
          isOnline = state.isConnected ?? false;
          if (isOnline) processTransactions();
        });

        // Refresh data after sync
        queryClient.invalidateQueries({queryKey: ['todos']});
      } catch (error) {
        Alert.alert('Error', 'Failed to initialize database');
      }
    };

    init();
    return () => unsubscribe?.();
  }, []);

  const addItem = () => {
    if (text.trim()) {
      addMutation.mutate(text.trim());
      setText('');
    }
  };

  const handleDelete = (item: LocalTodo) => {
    Alert.alert('Delete', 'Are you sure you want to delete this item?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        onPress: () => deleteMutation.mutate(item),
        style: 'destructive',
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter todo"
          value={text}
          onChangeText={setText}
          onSubmitEditing={addItem}
        />
        <TouchableOpacity style={styles.button} onPress={addItem}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => handleDelete(item)}>
            <Text>{item.content}</Text>
            {item.status === 'pending' && (
              <Text style={styles.pendingText}>Pending</Text>
            )}
            {item.status === 'synced' && (
              <Text style={styles.syncedText}>Synced</Text>
            )}
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      }}>
      <MainApp />
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  macContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginVertical: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tempIndicator: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  pendingText: {
    color: '#ffc107',
    fontSize: 12,
  },
  syncedText: {
    color: '#28a745',
    fontSize: 12,
  },
});
