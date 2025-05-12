import {contextApi, contextTaskApi, taskApi} from '../../api'; // Your existing API
import type {LocalContext} from '../../../types/context';
import type {LocalTask} from '../../../types/task';
import {LocalContextTask} from '../../../types/contextTask';

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
      const {data} = await taskApi.createTask(
        payload.name,
        payload.priority,
        payload.project_id,
      );
      return data;
    } catch (error) {
      console.error('Task creation failed in Amplify', error);
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
      if (!payload.server_context_id || !payload.server_task_id) {
        throw new Error('ContextTask Parent records not synced with server');
      }

      const {data} = await contextTaskApi.createAssociation(
        payload.server_context_id,
        payload.server_task_id,
      );
      return data;
    } catch (error) {
      console.error('ContextTask creation failed in Amplify', error);
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
}
