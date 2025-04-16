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

const client = generateClient<Schema>();

Amplify.configure(outputs);

// Query Client setup with persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours cache
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const MainApp = () => {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();

  // Fetch initial todos and set up real-time subscription
  const {data: todos = []} = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const {data: items} = await client.models.Todo.list();
      return items;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const subscription = client.models.Todo.observeQuery().subscribe({
      next: ({items}) => {
        // Update React Query cache with real-time changes
        queryClient.setQueryData(['todos'], items);
      },
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Add mutation with optimistic update
  const addMutation = useMutation({
    mutationFn: (content: string) => client.models.Todo.create({content}),
    onMutate: async content => {
      await queryClient.cancelQueries({queryKey: ['todos']});
      const previousTodos = queryClient.getQueryData(['todos']);

      queryClient.setQueryData(
        ['todos'],
        (old: Schema['Todo']['type'][] | undefined) => [
          ...(old || []),
          {id: `temp-${Date.now()}`, content, _version: 0}, // Temporary ID for optimistic update
        ],
      );

      return {previousTodos};
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos);
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['todos']});
    },
    retry: 3,
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: (item: Schema['Todo']['type']) =>
      client.models.Todo.delete(item),
    onMutate: async item => {
      await queryClient.cancelQueries({queryKey: ['todos']});
      const previousTodos = queryClient.getQueryData(['todos']);

      queryClient.setQueryData(
        ['todos'],
        (old: Schema['Todo']['type'][] | undefined) =>
          old?.filter(t => t.id !== item.id) || [],
      );

      return {previousTodos};
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos);
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['todos']});
    },
    retry: 3,
  });

  const addItem = async () => {
    if (text.trim()) {
      addMutation.mutate(text.trim());
      setText('');
    }
  };

  const handleDelete = (item: Schema['Todo']['type']) => {
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
            {/* Show temporary indicator for optimistic updates */}
            {item.id.startsWith('temp-') && (
              <Text style={styles.tempIndicator}>Syncing...</Text>
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
        persister: asyncStoragePersister, // Передаем persister внутри persistOptions
        maxAge: 1000 * 60 * 60 * 24, // 24 часа
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
});
