import {contextApi} from '../../api'; // Your existing API
import type {LocalContext} from '../../../types/context';

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
