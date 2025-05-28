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
import {AppNavigator} from './navigation/AppNavigator';
import {PaperProvider} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';

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
      <PaperProvider>
        <MainApp />
      </PaperProvider>
    </PersistQueryClientProvider>
  );
}

function MainApp() {
  useSync();
  return (
    <SafeAreaView style={{flex: 1}}>
      <AppNavigator />
    </SafeAreaView>
  );
}
