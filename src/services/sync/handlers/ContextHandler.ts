import {contextApi, contextTaskApi, taskApi} from '../../api'; // Your existing API
import type {LocalContext} from '../../../types/context';
import type {LocalTask} from '../../../types/task';
import {LocalContextTask} from '../../../types/contextTask';
import {db} from '../../database';

export class ContextHandler {
  static async create(payload: Omit<LocalContext, 'id'>) {
    const {data} = await contextApi.createContext(payload.name);
    if (!data) throw new Error('Context creation failed');
    return data;
  }

  static async update(serverId: string, payload: Partial<LocalContext>) {
    //await contextApi.updateContext(serverId, payload.name);
  }

  static async delete(serverId?: string) {
    if (serverId) {
      await contextApi.deleteContext(serverId);
    }
  }
}

export class TaskHandler {
  static async create(payload: Omit<LocalTask, 'id'>) {
    try {
      const response = await taskApi.createTask(
        payload.name,
        payload.priority,
        payload.project_id,
      );

      if (!response?.data) {
        throw new Error('Task creation failed: No data returned from API');
      }

      // Convert to plain object
      const plain = JSON.parse(JSON.stringify(response.data));
      console.log('----> TASK HANDLER PLAIN DATA:', plain);

      return plain.data;
    } catch (error) {
      console.error('Task creation failed in Amplify:', error);
      throw error;
    }
  }

  static async update(serverId: string, payload: Partial<LocalTask>) {
    //await taskApi.updateContext(serverId, payload.name);
  }

  static async delete(serverId?: string) {
    if (serverId) {
      await taskApi.deleteTask(serverId);
    }
  }
}

export class ContextsTasksHandler {
  static async create(payload: Omit<LocalContextTask, 'id'>) {
    try {
      console.log('Creating context-task with payload:', payload);

      // Get server IDs
      const [contextRecord, taskRecord] = await Promise.all([
        this.getServerId('contexts', payload.local_context_id),
        this.getServerId('tasks', payload.local_task_id),
      ]);

      console.log('Retrieved database records:', {contextRecord, taskRecord});

      // Check if records exist
      if (!contextRecord) {
        throw new Error(
          `Context record not found for local ID: ${payload.local_context_id}`,
        );
      }
      if (!taskRecord) {
        throw new Error(
          `Task record not found for local ID: ${payload.local_task_id}`,
        );
      }

      // Check if records have server IDs
      if (!contextRecord.server_id) {
        throw new Error(
          `Context record exists but has no server ID. Status: ${contextRecord.status}`,
        );
      }
      if (!taskRecord.server_id) {
        throw new Error(
          `Task record exists but has no server ID. Status: ${taskRecord.status}`,
        );
      }

      console.log('Creating association with server IDs:', {
        contextId: contextRecord.server_id,
        taskId: taskRecord.server_id,
      });

      const response = await contextTaskApi.createAssociation(
        contextRecord.server_id,
        taskRecord.server_id,
      );

      console.log('Context-task creation response:', response);

      if (!response?.data) {
        throw new Error(
          'Failed to create context-task association: No data returned',
        );
      }

      // Convert to plain object
      const plain = JSON.parse(JSON.stringify(response.data));
      console.log('----> TASK HANDLER PLAIN DATA:', plain);

      return plain.data;
    } catch (error) {
      console.error('ContextTask creation failed:', error);
      throw error;
    }
  }

  static async update(serverId: string, payload: Partial<LocalContextTask>) {
    //await taskApi.updateContext(serverId, payload.name);
  }

  static async delete(serverId?: string) {
    if (serverId) {
      await contextTaskApi.deleteAssociation(serverId);
    }
  }

  private static async getServerId(
    table: 'contexts' | 'tasks',
    localId: string,
  ) {
    try {
      console.log(`Getting server ID for ${table} with local ID:`, localId);

      // First, verify we have valid inputs
      if (!localId) {
        console.error(`Invalid localId provided for ${table}`);
        return null;
      }

      // Define the expected record type
      type DbRecord = {
        id: string;
        server_id: string | null;
        status: 'pending' | 'synced' | 'deleted';
      };

      // Execute the query within a promise
      return new Promise<DbRecord | null>((resolve, reject) => {
        db.transaction(
          tx => {
            const query = `SELECT id, server_id, status FROM ${table} WHERE id = ?`;
            console.log('Executing query:', query, 'with params:', [localId]);

            tx.executeSql(
              query,
              [localId],
              (_, resultSet) => {
                console.log(
                  `Query results for ${table}:`,
                  resultSet.rows.raw(),
                );

                if (resultSet.rows.length === 0) {
                  console.warn(
                    `No ${table} record found for local ID: ${localId}`,
                  );
                  resolve(null);
                  return;
                }

                const record = resultSet.rows.item(0) as DbRecord;
                console.log(`Found record for ${table}:`, record);

                if (!record.server_id) {
                  console.warn(
                    `Record found but no server_id for ${table} with local ID: ${localId}`,
                  );
                }

                resolve(record);
              },
              (_, error) => {
                console.error(`SQL Error for ${table}:`, error);
                reject(
                  new Error(`Database error for ${table}: ${error.message}`),
                );
                return false;
              },
            );
          },
          error => {
            console.error(`Transaction error for ${table}:`, error);
            reject(
              new Error(`Transaction failed for ${table}: ${error.message}`),
            );
          },
        );
      });
    } catch (error) {
      console.error(`Error in getServerId for ${table}:`, error);
      throw error;
    }
  }
}
