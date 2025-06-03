import {LocalContext} from './context';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  Contexts: undefined;
  Tasks: {context: LocalContext};
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
