import {LocalContext} from './context';

export type RootStackParamList = {
  MainTabs: undefined;
  Contexts: undefined;
  Tasks: {context: LocalContext};
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
