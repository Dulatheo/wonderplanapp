import {useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  initializeDatabase,
  performInitialSync2,
  setOnlineStatus,
  processor,
} from '../services/database';

export const useSync = () => {
  useEffect(() => {
    let unsubscribe: () => void;

    const initializeApp = async () => {
      try {
        await initializeDatabase();
        await performInitialSync2();
        await processor.processPendingTransactions();

        unsubscribe = NetInfo.addEventListener(state => {
          const isConnected = state.isConnected ?? false;
          setOnlineStatus(isConnected);
          if (isConnected) processor.processPendingTransactions();
        });
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
