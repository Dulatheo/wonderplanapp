import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {LocalContext} from '../types/context';
import {
  getContexts,
  createContextTransaction,
  processTransactions,
  deleteTaskTransaction,
} from '../services/database';

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
    mutationFn: (item: LocalContext) => deleteTaskTransaction(item),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['contexts']});
      processTransactions();
    },
  });

  return {contextsQuery, addMutation, deleteMutation};
};
