import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';
import {Text} from 'react-native';
import {queryClient} from './services/queryClient';
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
  return (
    <SafeAreaView style={{flex: 1}}>
      <AppNavigator />
    </SafeAreaView>
  );
}
