import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  createTaskTransaction,
  deleteTaskTransaction,
  getTasksByContext,
  updateTaskPriorityTransaction,
} from '../services/database/taskDb';
import {LocalTask, PriorityValue} from '../types/task';
import {LocalContext} from '../types/context';

export const useTasks = (context: LocalContext) => {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery<LocalTask[]>({
    queryKey: ['tasks', context.id],
    queryFn: () => getTasksByContext(context.id),
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (task: {name: string; priority: PriorityValue}) =>
      createTaskTransaction(context.id, task.name, task.priority),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tasks', context.id]});
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
      queryClient.invalidateQueries({queryKey: ['tasks', context.id]});
    },
    onError: error => {
      console.error('Priority update failed:', error);
    },
  });

  //Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (task: LocalTask) => deleteTaskTransaction(task),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tasks', context.id]});
    },
    onError: error => {
      console.error('Task deletion failed:', error);
    },
  });

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
