import {PriorityValue, LocalTask} from '../../types/task';
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
  contextId: string,
  name: string,
  priority: PriorityValue,
): Promise<string> => {
  const taskId = `task_${Date.now()}`;
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
            'create',
            'tasks',
            taskId,
            JSON.stringify({name, priority}),
            Date.now(),
          ],
        );

        tx.executeSql(
          `INSERT INTO tasks 
        (id, context_id, name, priority, created_at) 
        VALUES (?, ?, ?, ?, ?)`,
          [taskId, contextId, name, priority, Date.now()],
        );
      },
      error => reject(error),
      () => resolve(),
    );
  });

  return txId;
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
