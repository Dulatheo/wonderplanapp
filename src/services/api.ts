import {client} from './amplify';

export const contextApi = {
  listContexts: () => client.models.Context.list(),
  createContext: (name: string) => client.models.Context.create({name}),
  updateContext: (id: string, name: string) =>
    client.models.Context.update({id, name}),
  deleteContext: (id: string) => client.models.Context.delete({id}),
};

export const projectApi = {
  listProjects: () => client.models.Project.list(),
  createProject: (name: string) => client.models.Project.create({name}),
  updateProject: (id: string, name: string) =>
    client.models.Project.update({id, name}),
  deleteProject: (id: string) => client.models.Project.delete({id}),
};

export const taskApi = {
  listTasks: () => client.models.Task.list(),
  createTask: async (
    name: string,
    priority: number,
    projectId?: string | null,
  ) => {
    try {
      console.log('Creating task with:', {name, priority, projectId});
      const createInput = {
        name,
        priority,
        ...(projectId ? {projectId} : {}), // Only include projectId if it exists
      };
      console.log('Create input:', createInput);
      const result = await client.models.Task.create(createInput);
      console.log('Amplify create task response:', result);
      return {data: result};
    } catch (error) {
      console.error('Error creating task in Amplify:', error);
      throw error;
    }
  },
  updateTask: async (
    id: string,
    data: {
      name?: string;
      priority?: number;
      projectId?: string | null;
    },
  ) => {
    const updateInput = {
      id,
      ...data,
      ...(data.projectId === null ? {} : {projectId: data.projectId}),
    };
    const result = await client.models.Task.update(updateInput);
    return {data: result};
  },
  deleteTask: (id: string) => client.models.Task.delete({id}),
};

// Context-Task Relationship API
export const contextTaskApi = {
  createAssociation: async (contextId: string, taskId: string) => {
    try {
      console.log('Creating context-task association:', {contextId, taskId});
      const result = await client.models.ContextTask.create({
        contextId,
        taskId,
      });
      console.log('Amplify create association response:', result);
      return {data: result};
    } catch (error) {
      console.error('Error creating context-task association:', error);
      throw error;
    }
  },
  deleteAssociation: async (id: string) => {
    try {
      const result = await client.models.ContextTask.delete({id});
      return {data: result};
    } catch (error) {
      console.error('Error deleting context-task association:', error);
      throw error;
    }
  },
  listAssociations: () => client.models.ContextTask.list(),
};

// Utility functions
export const relationApi = {
  getTasksByProject: (projectId: string) =>
    client.models.Task.list({filter: {projectId: {eq: projectId}}}),

  getContextsForTask: async (taskId: string) => {
    const associations = await client.models.ContextTask.list({
      filter: {taskId: {eq: taskId}},
    });
    return Promise.all(
      associations.data.map(a => client.models.Context.get({id: a.contextId})),
    );
  },
};
