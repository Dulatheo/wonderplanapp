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
  createTask: (name: string, priority: number, projectId?: string | null) =>
    client.models.Task.create({name, priority, projectId: projectId || null}),
  updateTask: (
    id: string,
    data: {
      name?: string;
      priority?: number;
      projectId?: string | null;
    },
  ) => client.models.Task.update({id, ...data}),
  deleteTask: (id: string) => client.models.Task.delete({id}),
};

// Context-Task Relationship API
export const contextTaskApi = {
  createAssociation: (contextId: string, taskId: string) =>
    client.models.ContextTask.create({contextId, taskId}),
  deleteAssociation: (id: string) => client.models.ContextTask.delete({id}),
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
