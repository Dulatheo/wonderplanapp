import {ContextHandler} from './ContextHandler';

export const handlers = {
  contexts: ContextHandler,
};

export type HandlerMap = typeof handlers;
