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
            Tasks.*,
            GROUP_CONCAT(Contexts.name) AS context_names,
            Projects.name AS project_name
           FROM Tasks
           LEFT JOIN ContextsTasks 
             ON Tasks.id = ContextsTasks.local_task_id 
             AND ContextsTasks.status != 'deleted' -- Exclude deleted associations
           LEFT JOIN Contexts 
             ON ContextsTasks.local_context_id = Contexts.id 
             AND Contexts.status != 'deleted' -- Exclude deleted contexts
           LEFT JOIN Projects 
             ON Tasks.project_id = Projects.id 
             AND Projects.status != 'deleted' -- Exclude deleted projects
           WHERE Tasks.status != 'deleted'
           GROUP BY Tasks.id;`,
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
