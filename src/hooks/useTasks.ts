import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  createTaskTransaction,
  deleteTaskTransaction,
  getAllTasks,
  fetchTasksWithDetails,
  getTasksByContext,
  updateTaskPriorityTransaction,
} from '../services/database/taskDb';
import {LocalTask, PriorityValue, LocalTaskWithDetails} from '../types/task';
import {LocalContext} from '../types/context';
import {processor} from '../services/database';

export const useTasks = (context?: LocalContext) => {
  const queryClient = useQueryClient();
  const queryKey = context ? ['tasks', context.id] : ['tasks'];

  const tasksQuery = useQuery<LocalTaskWithDetails[]>({
    queryKey: queryKey,
    queryFn: () =>
      context ? getTasksByContext(context.id) : fetchTasksWithDetails(),
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (task: {
      name: string;
      priority: PriorityValue;
      contextIds: string[];
    }) => createTaskTransaction(task.name, task.priority, task.contextIds),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKey});
      processTransactions();
    },
    onError: error => {
      console.error('Task creation failed:', error);
    },
  });

  // Update priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: (params: {taskId: string; newPriority: PriorityValue}) =>
      updateTaskPriorityTransaction(params.taskId, params.newPriority),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKey});
      processTransactions();
    },
    onError: error => {
      console.error('Priority update failed:', error);
    },
  });

  //Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (task: LocalTask) => deleteTaskTransaction(task),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKey});
      processTransactions();
    },
    onError: error => {
      console.error('Task deletion failed:', error);
    },
  });

  const processTransactions = async () => {
    await processor.processPendingTransactions();
  };

  return {
    tasksQuery,
    createTask: createTaskMutation.mutate,
    updatePriority: updatePriorityMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updatePriorityMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
};
