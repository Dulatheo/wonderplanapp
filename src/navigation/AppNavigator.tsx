import {createStackNavigator} from '@react-navigation/stack';
import {ContextsListScreen} from '../screens/ContextsListScreen';
import {TasksListScreen} from '../screens/TasksListScreen';
import {RootStackParamList} from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Contexts" component={ContextsListScreen} />
    <Stack.Screen
      name="Tasks"
      component={TasksListScreen}
      options={{title: 'Tasks in Context'}}
    />
  </Stack.Navigator>
);
