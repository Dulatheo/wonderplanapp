import {PriorityValue, LocalTask, LocalTaskWithDetails} from '../../types/task';
import {db} from '../database';

export const getAllTasks = async (): Promise<LocalTask[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM tasks 
           WHERE status != 'deleted' 
           ORDER BY priority ASC, created_at DESC`,
        [],
        (_, result) => resolve(result.rows.raw()),
        (_, error) => reject(error),
      );
    });
  });
};

export const getTasksByContext = async (
  contextId: string,
): Promise<LocalTask[]> => {
  console.log('Fetching tasks by context');
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM tasks 
           WHERE context_id = ? 
            AND status != 'deleted' 
           ORDER BY priority ASC, created_at DESC`,
        [contextId],
        (_, result) => resolve(result.rows.raw()),
        (_, error) => reject(error),
      );
    });
  });
};

export const fetchTasksWithDetails = async (): Promise<
  LocalTaskWithDetails[]
> => {
  console.log('Fetching tasks with details');
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT 
            tasks.*,
            GROUP_CONCAT(contexts.name) AS context_names,
            projects.name AS project_name
         FROM tasks
         LEFT JOIN contexts_tasks 
           ON tasks.id = contexts_tasks.local_task_id 
           AND contexts_tasks.status != 'deleted'
         LEFT JOIN contexts 
           ON contexts_tasks.local_context_id = contexts.id 
           AND contexts.status != 'deleted'
         LEFT JOIN projects 
           ON tasks.project_id = projects.id 
           AND projects.status != 'deleted'
         WHERE tasks.status != 'deleted'
         GROUP BY tasks.id;`,
        [],
        (_, {rows}) => {
          // Ensure we always return an array
          const result = (rows as any)._array || [];
          resolve(result);
        },
        (_, error) => {
          console.error('SQL Error:', error);
          // Return empty array instead of rejecting
          resolve([]);
          return false;
        },
      );
    });
  });
};

export const updateTaskPriorityTransaction = async (
  taskId: string,
  newPriority: PriorityValue,
): Promise<string> => {
  const txId = `tx_${Date.now()}`;

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          `INSERT INTO transactions 
        (id, type, entityType, entityId, payload, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?)`,
          [
            txId,
            'update',
            'tasks',
            taskId,
            JSON.stringify({priority: newPriority}),
            Date.now(),
          ],
        );

        tx.executeSql(`UPDATE tasks SET priority = ? WHERE id = ?`, [
          newPriority,
          taskId,
        ]);
      },
      error => reject(error),
      () => resolve(),
    );
  });

  return txId;
};

export const createTaskTransaction = async (
  name: string,
  priority: PriorityValue,
  contextIds: string[],
): Promise<string> => {
  const taskId = `task_${Date.now()}`;
  const txId = `tx_${Date.now()}`;

  try {
    await new Promise<void>((resolve, reject) => {
      db.transaction(
        tx => {
          // First, create the task record
          tx.executeSql(
            `INSERT INTO tasks 
            (id, name, priority, status, created_at, version) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [taskId, name, priority, 'pending', Date.now(), 1],
            (_, result) => {
              if (result.rowsAffected === 0) {
                reject(new Error('Failed to create task record'));
                return;
              }

              // Then create the transaction record
              tx.executeSql(
                `INSERT INTO transactions 
                (id, type, entityType, entityId, payload, createdAt, status, retries) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  txId,
                  'create',
                  'tasks',
                  taskId,
                  JSON.stringify({name, priority}),
                  Date.now(),
                  'pending',
                  0,
                ],
                (_, transResult) => {
                  if (transResult.rowsAffected === 0) {
                    reject(new Error('Failed to create transaction record'));
                    return;
                  }

                  // Finally, create the context associations if any
                  if (contextIds && contextIds.length > 0) {
                    contextIds.forEach(contextId => {
                      const associationId = `ctx_task_${Date.now()}_${contextId}`;
                      const assocTxId = `tx_${Date.now()}_${contextId}`;

                      tx.executeSql(
                        `INSERT INTO contexts_tasks 
                        (id, local_context_id, local_task_id, status, created_at, version) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                          associationId,
                          contextId,
                          taskId,
                          'pending',
                          Date.now(),
                          1,
                        ],
                        (_, assocResult) => {
                          if (assocResult.rowsAffected === 0) {
                            console.warn(
                              `Failed to create context association for context ${contextId}`,
                            );
                          }
                        },
                      );

                      tx.executeSql(
                        `INSERT INTO transactions 
                        (id, type, entityType, entityId, payload, createdAt, status, retries) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                          assocTxId,
                          'create',
                          'contexts_tasks',
                          associationId,
                          JSON.stringify({
                            local_context_id: contextId,
                            local_task_id: taskId,
                          }),
                          Date.now(),
                          'pending',
                          0,
                        ],
                        (_, assocTxResult) => {
                          if (assocTxResult.rowsAffected === 0) {
                            console.warn(
                              `Failed to create context association transaction for context ${contextId}`,
                            );
                          }
                        },
                      );
                    });
                  }
                  resolve();
                },
              );
            },
          );
        },
        error => {
          console.error('Transaction error:', error);
          reject(error);
        },
        () => resolve(),
      );
    });

    return txId;
  } catch (error) {
    console.error('Failed to create task transaction:', error);
    throw error;
  }
};

export const deleteTaskTransaction = async (
  item: LocalTask,
): Promise<string> => {
  const txId = `tx_${Date.now()}`;

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          `INSERT INTO transactions 
          (id, type, entityType, entityId, payload, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            txId,
            'delete',
            'tasks',
            item.id,
            JSON.stringify({serverId: item.server_id}),
            Date.now(),
          ],
        );

        tx.executeSql(`UPDATE tasks SET status = 'deleted' WHERE id = ?`, [
          item.id,
        ]);
      },
      error => reject(error),
      () => resolve(),
    );
  });

  return txId;
};
