import {createStackNavigator} from '@react-navigation/stack';
import {ContextsListScreen} from '../screens/ContextsListScreen';
import {TasksListScreen} from '../screens/TasksListScreen';
import {RootStackParamList} from '../types/navigation';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {TodayScreen} from '../screens/TodayScreen';
import {NavigationContainer} from '@react-navigation/native';
import {ExploreScreen} from '../screens/ExploreScreen';
import {AuthScreen} from '../screens/AuthScreen';
import React, {useEffect, useState} from 'react';
import {getCurrentUser, signOut} from 'aws-amplify/auth';

// Create tab navigator
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

// Add prop types for TabNavigator
interface TabNavigatorProps {
  userEmail: string | null;
  onSignOut: () => void;
}

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

function TabNavigator({userEmail, onSignOut}: TabNavigatorProps) {
  return (
    <>
      <View
        style={{
          padding: 8,
          backgroundColor: '#f5f5f5',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text style={{fontSize: 14, color: '#333'}}>
          Signed in as: {userEmail}
        </Text>
        <TouchableOpacity
          onPress={onSignOut}
          style={{
            marginLeft: 16,
            backgroundColor: '#e74c3c',
            padding: 8,
            borderRadius: 6,
          }}>
          <Text style={{color: 'white', fontWeight: 'bold'}}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      <Tab.Navigator>
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Plan" component={PlanScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Explore" component={ExploreScreen} />
      </Tab.Navigator>
    </>
  );
}

export const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(true);
        setUserEmail(user?.signInDetails?.loginId || user?.username || null);
        console.log('[AppNavigator] User is authenticated:', user);
      } catch (err) {
        setIsAuthenticated(false);
        setUserEmail(null);
        console.log('[AppNavigator] No authenticated user:', err);
      } finally {
        setIsLoading(false);
        console.log(
          '[AppNavigator] Finished checking auth. isAuthenticated:',
          isAuthenticated,
        );
      }
    };
    checkAuth();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsAuthenticated(false);
    setUserEmail(null);
    console.log('[AppNavigator] User signed out');
  };

  if (isLoading) {
    console.log('[AppNavigator] Loading...');
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Loading...</Text>
      </View>
    );
  }

  console.log('[AppNavigator] Rendering. isAuthenticated:', isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? 'MainTabs' : 'Auth'}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{headerShown: false}}
          />
        ) : (
          <Stack.Screen name="MainTabs" options={{headerShown: false}}>
            {() => (
              <TabNavigator userEmail={userEmail} onSignOut={handleSignOut} />
            )}
          </Stack.Screen>
        )}
        <Stack.Screen name="Contexts" component={ContextsListScreen} />
        <Stack.Screen
          name="Tasks"
          component={TasksListScreen}
          options={({route}) => ({
            title: route.params?.context.name || 'Tasks',
          })}
        />
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
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 80,
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
    marginTop: -4,
  },
});
