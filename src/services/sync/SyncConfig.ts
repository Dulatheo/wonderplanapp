import {projectApi, taskApi, contextApi, contextTaskApi} from '../api';
import {getLocalItems} from '../database';

export interface SyncTableConfig {
  tableName: string;
  apiList: () => Promise<any>;
  mapRemoteToLocal: (remoteItem: any) => Promise<any>;
  updateColumns: string[];
  insertColumns: string[];
  versionUpdate?: boolean;
  dependsOn?: string[];
  isJoinTable?: boolean;
}

const SYNC_ORDER: Record<string, number> = {
  projects: 1,
  contexts: 1,
  tasks: 2,
  context_tasks: 3,
};

export const syncConfigs: SyncTableConfig[] = [
  {
    tableName: 'projects',
    apiList: projectApi.listProjects,
    mapRemoteToLocal: async remote => ({
      name: remote.name,
      status: 'synced',
      server_id: remote.id,
      created_at: new Date(remote.createdAt).getTime(),
      version: 1,
    }),
    updateColumns: ['name'],
    insertColumns: [
      'id',
      'name',
      'status',
      'server_id',
      'created_at',
      'version',
    ],
  },
  {
    tableName: 'contexts',
    apiList: contextApi.listContexts,
    mapRemoteToLocal: async remote => ({
      name: remote.name,
      status: 'synced',
      server_id: remote.id,
      created_at: new Date(remote.createdAt).getTime(),
      version: 1,
    }),
    updateColumns: ['name'],
    insertColumns: [
      'id',
      'name',
      'status',
      'server_id',
      'created_at',
      'version',
    ],
  },
  {
    tableName: 'tasks',
    apiList: taskApi.listTasks,
    mapRemoteToLocal: async remote => {
      const localProjects = await getLocalItems('projects');
      const project = localProjects.find(p => p.server_id === remote.projectId);

      return {
        name: remote.name,
        priority: remote.priority,
        project_id: project?.id || null,
        status: 'synced',
        server_id: remote.id,
        created_at: new Date(remote.createdAt).getTime(),
        version: 1,
      };
    },
    updateColumns: ['name', 'priority', 'project_id'],
    insertColumns: [
      'id',
      'name',
      'priority',
      'project_id',
      'status',
      'server_id',
      'created_at',
      'version',
    ],
    dependsOn: ['projects'],
    isJoinTable: false,
  },
  {
    tableName: 'contexts_tasks',
    apiList: contextTaskApi.listAssociations,
    mapRemoteToLocal: async remote => {
      const [contexts, tasks] = await Promise.all([
        getLocalItems('contexts'),
        getLocalItems('tasks'),
      ]);

      const context = contexts.find(c => c.server_id === remote.contextId);
      const task = tasks.find(t => t.server_id === remote.taskId);

      if (!context || !task) {
        throw new Error('Missing related entity for context-task association');
      }

      return {
        local_context_id: context.id,
        local_task_id: task.id,
        server_id: remote.id,
        server_context_id: remote.contextId,
        server_task_id: remote.taskId,
        status: 'synced',
        created_at: new Date(remote.createdAt).getTime(),
        version: 1,
      };
    },
    updateColumns: [
      'local_context_id',
      'local_task_id',
      'server_context_id',
      'server_task_id',
      'status',
    ],
    insertColumns: [
      'id',
      'local_context_id',
      'local_task_id',
      'server_id',
      'server_context_id',
      'server_task_id',
      'status',
      'created_at',
      'version',
    ],
    versionUpdate: false,
    dependsOn: ['contexts', 'tasks'],
    isJoinTable: true,
  },
];
