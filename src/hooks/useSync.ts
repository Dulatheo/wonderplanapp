import {useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  initializeDatabase,
  performInitialSync,
  processTransactions,
  setOnlineStatus,
} from '../services/database';
import {queryClient} from '../services/queryClient';

export const useSync = () => {
  useEffect(() => {
    let unsubscribe: () => void;

    const initializeApp = async () => {
      try {
        await initializeDatabase();
        await performInitialSync();
        await processTransactions();

        unsubscribe = NetInfo.addEventListener(state => {
          const isConnected = state.isConnected ?? false;
          setOnlineStatus(isConnected);
          if (isConnected) processTransactions();
        });

        queryClient.invalidateQueries({queryKey: ['todos']});
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initializeApp();

    return () => {
      unsubscribe?.();
    };
  }, []);
};
