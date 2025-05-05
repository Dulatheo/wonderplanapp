import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {LocalContext} from '../types/context';
import {processor} from '../services/database';

import {
  getContexts,
  createContextTransaction,
  deleteContextTransaction,
} from '../services/database/contextDb';

export const useContexts = () => {
  const queryClient = useQueryClient();

  const contextsQuery = useQuery<LocalContext[]>({
    queryKey: ['contexts'],
    queryFn: () => getContexts(),
  });

  const addMutation = useMutation({
    mutationFn: (name: string) => createContextTransaction(name),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['contexts']});
      processTransactions();
    },
    onError(error, variables, context) {
      console.log(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (item: LocalContext) => deleteContextTransaction(item),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['contexts']});
      processTransactions();
    },
  });

  const processTransactions = async () => {
    await processor.processPendingTransactions();
  };

  return {contextsQuery, addMutation, deleteMutation};
};
