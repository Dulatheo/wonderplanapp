import {projectApi, taskApi, contextApi, contextTaskApi} from '../api';
import {getLocalItems} from '../database';

// Store local IDs for each entity type
const localIdMaps = {
  tasks: new Map<string, string>(),
  contexts: new Map<string, string>(),
};

export interface SyncTableConfig {
  tableName: string;
  apiList: () => Promise<any>;
  mapRemoteToLocal: (remoteItem: any) => Promise<any>;
  updateColumns: string[];
  insertColumns: string[];
  versionUpdate?: boolean;
  dependsOn?: string[];
}

export const DEPENDENCY_ORDER: SyncTableConfig['tableName'][] = [
  'projects',
  'contexts',
  'tasks',
  'contexts_tasks',
];

export const syncConfigs: SyncTableConfig[] = [
  {
    tableName: 'projects',
    apiList: projectApi.listProjects,
    mapRemoteToLocal: async remote => ({
      id: `proj_${Date.now()}_${remote.id}`,
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
    mapRemoteToLocal: async remote => {
      // Fetch all local contexts
      const localContexts = await getLocalItems('contexts');
      // Try to find an existing local context with the same server_id
      let local = localContexts.find(c => c.server_id === remote.id);

      if (local) {
        // Store the local ID for this context for later use
        localIdMaps.contexts.set(remote.id, local.id);
        // Optionally update fields if needed
        return {
          ...local,
          name: remote.name,
          status: 'synced',
          server_id: remote.id,
          created_at: new Date(remote.createdAt).getTime(),
          version: 1,
        };
      } else {
        // Create a new local context if not found
        const localId = `ctx_${Date.now()}_${remote.id}`;
        localIdMaps.contexts.set(remote.id, localId);
        return {
          id: localId,
          name: remote.name,
          status: 'synced',
          server_id: remote.id,
          created_at: new Date(remote.createdAt).getTime(),
          version: 1,
        };
      }
    },
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

      // Fetch all local tasks
      const localTasks = await getLocalItems('tasks');
      // Try to find an existing local task with the same server_id
      let local = localTasks.find(t => t.server_id === remote.id);

      if (local) {
        // Store the local ID for this task for later use
        localIdMaps.tasks.set(remote.id, local.id);
        // Optionally update fields if needed
        return {
          ...local,
          name: remote.name,
          priority: remote.priority,
          project_id: project?.id || null,
          status: 'synced',
          server_id: remote.id,
          created_at: new Date(remote.createdAt).getTime(),
          version: 1,
        };
      } else {
        // Create a new local task if not found
        const localId = `task_${Date.now()}_${remote.id}`;
        localIdMaps.tasks.set(remote.id, localId);
        return {
          id: localId,
          name: remote.name,
          priority: remote.priority,
          project_id: project?.id || null,
          status: 'synced',
          server_id: remote.id,
          created_at: new Date(remote.createdAt).getTime(),
          version: 1,
        };
      }
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
  },
  {
    tableName: 'contexts_tasks',
    apiList: contextTaskApi.listAssociations,
    mapRemoteToLocal: async remote => {
      const [contexts, tasks] = await Promise.all([
        getLocalItems('contexts'),
        getLocalItems('tasks'),
      ]);

      console.log('[SyncConfig] Retrieved local items:', {
        contextsCount: contexts.length,
        tasksCount: tasks.length,
      });

      const localTaskId = localIdMaps.tasks.get(remote.taskId);
      const localContextId = localIdMaps.contexts.get(remote.contextId);

      console.log(
        '[SyncConfig] Found local items: local_task_id:',
        localTaskId,
        'local_context_id:',
        localContextId,
      );

      if (!localContextId || !localTaskId) {
        console.error('[SyncConfig] Missing related entity:', {
          hasContext: !!localContextId,
          hasTask: !!localTaskId,
          remoteContextId: remote.contextId,
          remoteTaskId: remote.taskId,
          availableTaskServerIds: tasks.map(t => t.server_id),
          availableTaskIds: tasks.map(t => t.id),
          storedLocalTaskId: localTaskId,
          storedLocalContextId: localContextId,
        });
        throw new Error('Missing related entity for context-task association');
      }

      const mapped = {
        id: `ctx_task_${Date.now()}_${remote.id}`,
        local_context_id: localContextId,
        local_task_id: localTaskId,
        server_id: remote.id,
        server_context_id: remote.contextId,
        server_task_id: remote.taskId,
        status: 'synced',
        created_at: new Date(remote.createdAt).getTime(),
        version: 1,
      };

      console.log('[SyncConfig] Final mapped contexts_tasks object:', {
        local_context_id: mapped.local_context_id,
        local_task_id: mapped.local_task_id,
        server_context_id: mapped.server_context_id,
        server_task_id: mapped.server_task_id,
      });

      return mapped;
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
  },
];
