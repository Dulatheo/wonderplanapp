import {LocalContext} from './context';

export type RootStackParamList = {
  Contexts: undefined;
  Tasks: {context: LocalContext};
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
