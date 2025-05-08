import {LocalTask} from '../../types/task';
import {db} from '../database';

export type TaskWithDetails = LocalTask & {
  context_names?: string;
  project_name?: string;
};

export const fetchTasksWithDetails = async (): Promise<TaskWithDetails[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT 
            tasks.*,
            GROUP_CONCAT(contexts.name) AS context_names,
            projects.name AS project_name
           FROM tasks
           LEFT JOIN contexts_tasks 
             ON Tasks.id = contexts_tasks.local_task_id 
             AND contexts_tasks.status != 'deleted' -- Exclude deleted associations
           LEFT JOIN contexts 
             ON contexts_tasks.local_context_id = Contexts.id 
             AND contexts.status != 'deleted' -- Exclude deleted contexts
           LEFT JOIN projects 
             ON tasks.project_id = projects.id 
             AND projects.status != 'deleted' -- Exclude deleted projects
           WHERE tasks.status != 'deleted'
           GROUP BY tasks.id;`,
        [],
        (_, {rows}) => resolve((rows as any)._array),
        (_, error) => {
          reject(error);
          return false;
        },
      );
    });
  });
};
