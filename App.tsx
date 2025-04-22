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
type LocalTodo = {
  id: string;
  content: string;
  status: 'pending' | 'synced' | 'deleted';
  server_id?: string;
  created_at: number;
};

// Initialize database table
const initializeDatabase = async () => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // First create the table
      await new Promise<void>((resolveCreate, rejectCreate) => {
        db.transaction(tx => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS todos (
              id TEXT PRIMARY KEY,
              content TEXT,
              status TEXT DEFAULT 'pending',
              server_id TEXT,
              created_at INTEGER
            );`,
            [],
            () => resolveCreate(),
            error => rejectCreate(error),
          );
        });
      });

      // Then perform initial sync
      await performInitialSync();
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
      syncToAmplify();
    }
  });
};

const performInitialSync = async () => {
  try {
    // Fetch from Amplify
    const {data: remoteItems} = await client.models.Todo.list();

    // Insert into local DB
    db.transaction(tx => {
      remoteItems.forEach(item => {
        tx.executeSql(
          `INSERT OR REPLACE INTO todos 
          (id, content, status, server_id, created_at) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            `local-${item.id}`, // Generate local ID
            item.content,
            'synced',
            item.id,
            Date.now(),
          ],
        );
      });
    });
    queryClient.invalidateQueries({queryKey: ['todos']});
  } catch (error) {
    console.error('Initial sync failed:', error);
  }
};

// Sync function
const syncToAmplify = async () => {
  if (!isOnline || !isDbInitialized) return;
  try {
    // Sync pending additions
    const pendingAdditions = await new Promise<LocalTodo[]>(
      (resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM todos WHERE status = "pending"',
            [],
            (_, result) => resolve(result.rows.raw()),
            error => reject(error),
          );
        });
      },
    );

    for (const localItem of pendingAdditions) {
      try {
        const {data: serverItem} = await client.models.Todo.create({
          content: localItem.content,
        });

        db.transaction(tx => {
          tx.executeSql(
            'UPDATE todos SET status = "synced", server_id = ? WHERE id = ?',
            [serverItem?.id, localItem.id],
          );
        });
        queryClient.invalidateQueries({queryKey: ['todos']});
      } catch (error) {
        console.error('Sync addition error:', error);
      }
    }

    // Sync deletions
    const pendingDeletions = await new Promise<LocalTodo[]>(
      (resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM todos WHERE status = "deleted" AND server_id IS NOT NULL',
            [],
            (_, result) => resolve(result.rows.raw()),
            error => reject(error),
          );
        });
      },
    );

    for (const localItem of pendingDeletions) {
      try {
        // Add type guard to ensure server_id exists
        if (localItem.server_id) {
          await client.models.Todo.delete({id: localItem.server_id});

          db.transaction(tx => {
            tx.executeSql('DELETE FROM todos WHERE id = ?', [localItem.id]);
          });
        } else {
          // Handle items that somehow made it to deletions without server_id
          console.warn('No server_id for deletion:', localItem);
          db.transaction(tx => {
            tx.executeSql('DELETE FROM todos WHERE id = ?', [localItem.id]);
          });
        }
      } catch (error) {
        console.error('Sync deletion error:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
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

  // Add todo mutation
  const addMutation = useMutation({
    mutationFn: async (content: string) => {
      const newItem: LocalTodo = {
        id: `local-${Date.now()}`,
        content,
        status: 'pending',
        created_at: Date.now(),
      };

      await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'INSERT INTO todos (id, content, status, created_at) VALUES (?, ?, ?, ?)',
            [newItem.id, newItem.content, newItem.status, newItem.created_at],
            (_, result) => resolve(result),
            (_, error) => reject(error),
          );
        });
      });
      return newItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['todos']});
      syncToAmplify();
    },
  });

  // Delete todo mutation
  const deleteMutation = useMutation({
    mutationFn: async (item: LocalTodo) => {
      await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            item.server_id
              ? 'UPDATE todos SET status = "deleted" WHERE id = ?'
              : 'DELETE FROM todos WHERE id = ?',
            [item.id],
            (_, result) => resolve(result),
            (_, error) => reject(error),
          );
        });
      });
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['todos']});
      syncToAmplify();
    },
  });

  useEffect(() => {
    let unsubscribe: () => void;

    const init = async () => {
      try {
        await initializeDatabase();

        // Correct network listener setup
        unsubscribe = NetInfo.addEventListener(state => {
          isOnline = state.isConnected ?? false;
          if (isOnline && isDbInitialized) {
            syncToAmplify();
          }
        });

        await syncToAmplify();
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('Error', 'Failed to initialize database');
      }
    };

    init();

    // Correct cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
              <Text style={styles.pendingText}>Pending Sync</Text>
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
