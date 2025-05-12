import {
  ContextHandler,
  ContextsTasksHandler,
  TaskHandler,
} from './ContextHandler';

export const handlers = {
  contexts: ContextHandler,
  tasks: TaskHandler,
  contexts_tasks: ContextsTasksHandler,
};

export type HandlerMap = typeof handlers;
