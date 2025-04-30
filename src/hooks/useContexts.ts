import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {LocalContext} from '../types/context';
import {
  getContexts,
  createTodoTransaction,
  processTransactions,
  deleteTodoTransaction,
} from '../services/database';

export const useContexts = () => {
  const queryClient = useQueryClient();

  const contextsQuery = useQuery<LocalContext[]>({
    queryKey: ['contexts'],
    queryFn: () => getContexts(),
  });

  const addMutation = useMutation({
    mutationFn: (content: string) => createTodoTransaction(content),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['contexts']});
      processTransactions();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (item: LocalContext) => deleteTodoTransaction(item),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['contexts']});
      processTransactions();
    },
  });

  return {contextsQuery, addMutation, deleteMutation};
};
