import {createStackNavigator} from '@react-navigation/stack';
import {ContextsListScreen} from '../screens/ContextsListScreen';
import {TasksListScreen} from '../screens/TasksListScreen';
import {RootStackParamList} from '../types/navigation';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {TodayScreen} from '../screens/TodayScreen';
import {NavigationContainer} from '@react-navigation/native';
import {ExploreScreen} from '../screens/ExploreScreen';

// Create tab navigator
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

function PlanScreen() {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Plan</Text>
    </View>
  );
}

function SearchScreen() {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Search</Text>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => (
  // <Stack.Navigator>
  //   {/* <Stack.Screen name="Contexts" component={ContextsListScreen} />
  //   <Stack.Screen
  //     name="Tasks"
  //     component={TasksListScreen}
  //     options={({route}) => ({title: route.params?.context.name || 'Tasks'})}
  //   /> */}
  // </Stack.Navigator>
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen name="Contexts" component={ContextsListScreen} />
    </Stack.Navigator>

    <View style={styles.fabContainer}>
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => console.log('Add pressed')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 80, // Adjust based on your tab bar height
    zIndex: 999,
  },
  fabButton: {
    backgroundColor: '#00ADB5',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -4, // Adjust vertical alignment
  },
});
