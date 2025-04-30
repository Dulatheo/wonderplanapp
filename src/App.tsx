import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';
import {View} from 'react-native';
import {queryClient} from './services/queryClient';
import {useContexts} from './hooks/useContexts';
import {useSync} from './hooks/useSync';
import {TodoForm} from './components/TodoForm';
import {ContextList} from './components/ContextList';
import {styles} from './styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24,
      }}>
      <TodoApp />
    </PersistQueryClientProvider>
  );
}

// Child component (uses React Query hooks)
function TodoApp() {
  useSync(); // ✅ Now called INSIDE the provider
  const {contextsQuery, addMutation, deleteMutation} = useContexts(); // ✅ Now inside the provider

  return (
    <View style={styles.container}>
      <TodoForm onSubmit={content => addMutation.mutate(content)} />
      <ContextList
        contexts={contextsQuery.data || []}
        onDelete={item => deleteMutation.mutate(item)}
      />
    </View>
  );
}
