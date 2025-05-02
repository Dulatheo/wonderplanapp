import {client} from './amplify';

export const contextApi = {
  listContexts: () => client.models.Context.list(),
  createContext: (name: string) => client.models.Context.create({name: name}),
  deleteContext: (id: string) => client.models.Context.delete({id}),
};
