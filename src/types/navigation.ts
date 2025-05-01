export type RootStackParamList = {
  Contexts: undefined;
  Tasks: {contextId: string}; // Define required params here
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
