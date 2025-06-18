import {createStackNavigator} from '@react-navigation/stack';
import {ContextsListScreen} from '../screens/ContextsListScreen';
import {TasksListScreen} from '../screens/TasksListScreen';
import {RootStackParamList} from '../types/navigation';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import {TodayScreen} from '../screens/TodayScreen';
import {NavigationContainer} from '@react-navigation/native';
import {ExploreScreen} from '../screens/ExploreScreen';
import {AuthScreen} from '../screens/AuthScreen';
import React, {useEffect, useState} from 'react';
import {getCurrentUser, signOut} from 'aws-amplify/auth';
import {Amplify} from 'aws-amplify';
import outputs from '../../amplify_outputs.json';
import {useSync} from '../hooks/useSync';
import {Hub} from 'aws-amplify/utils';
import {clearLocalData} from '../services/database';
import CustomBottomBar from '../components/CustomBottomBar';
import {FONTS} from '../constants/fonts';

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

const MenuButton = () => (
  <TouchableOpacity style={styles.menuButton}>
    <Image
      source={require('../assets/icons/three-dots.png')}
      style={styles.menuDots}
    />
  </TouchableOpacity>
);

function TabNavigator({userEmail, onSignOut}: TabNavigatorProps) {
  useSync();

  return (
    <Tab.Navigator
      tabBar={props => <CustomBottomBar {...props} />}
      screenOptions={{
        headerStyle: {
          height: 104,
          backgroundColor: '#FFFFFF',
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
        },
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: '600',
          color: '#000000',
          fontFamily: FONTS.PROXIMA.SEMIBOLD,
          ...Platform.select({
            ios: {
              marginTop: -30, // Move the title up on iOS
            },
          }),
        },
        headerTitleAlign: 'left',
        headerRight: () => <MenuButton />,
        headerRightContainerStyle: {
          paddingRight: 20,
          ...Platform.select({
            ios: {
              marginTop: -30, // Match the title's position
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: FONTS.PROXIMA.REGULAR,
        },
      }}>
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          title: 'Today',
          tabBarLabel: ({focused}) => (
            <Text
              style={{
                fontSize: 12,
                fontFamily: FONTS.PROXIMA.REGULAR,
                color: focused ? '#000000' : '#666666',
              }}>
              Today
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{
          title: 'Plan',
          tabBarLabel: ({focused}) => (
            <Text
              style={{
                fontSize: 12,
                fontFamily: FONTS.PROXIMA.REGULAR,
                color: focused ? '#000000' : '#666666',
              }}>
              Plan
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
          tabBarLabel: ({focused}) => (
            <Text
              style={{
                fontSize: 12,
                fontFamily: FONTS.PROXIMA.REGULAR,
                color: focused ? '#000000' : '#666666',
              }}>
              Search
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: 'Explore',
          tabBarLabel: ({focused}) => (
            <Text
              style={{
                fontSize: 12,
                fontFamily: FONTS.PROXIMA.REGULAR,
                color: focused ? '#000000' : '#666666',
              }}>
              Explore
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    Amplify.configure(outputs);

    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(true);
        setUserEmail(user?.username || null);
        console.log('[AppNavigator] User is authenticated:', user);
      } catch (err) {
        setIsAuthenticated(false);
        setUserEmail(null);
        await clearLocalData();
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

    const hubListenerCancelToken = Hub.listen('auth', ({payload}) => {
      switch (payload.event) {
        case 'signedIn':
          console.log('user have been signedIn successfully.');
          checkAuth();
        case 'signedOut':
          console.log('user have been signedOut successfully.');
          checkAuth();
      }
    });

    return () => {
      hubListenerCancelToken();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    await clearLocalData();
    setIsAuthenticated(false);
    setUserEmail(null);
    console.log('[AppNavigator] User signed out and local data cleared');
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
  menuButton: {
    width: 32,
    height: 32,
  },
  menuDots: {
    width: 32,
    height: 32,
  },
});
