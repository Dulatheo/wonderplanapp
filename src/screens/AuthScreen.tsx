import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import {signInWithRedirect, getCurrentUser, signOut} from 'aws-amplify/auth';
import {Auth} from 'aws-amplify';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

export const AuthScreen = () => {
  const navigation = useNavigation<AuthScreenNavigationProp>();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithRedirect({
        provider: 'Google',
      });

      try {
        // After successful redirect, get the current user
        const user = await getCurrentUser();
        if (user) {
          console.log('User signed in:', user);
          // Navigation to MainTabs is now handled by AppNavigator based on auth state
        }
      } catch (error) {
        console.error('Error getting user in sign in with Google:', error);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithRedirect({
        provider: 'Apple',
      });

      try {
        const user = await getCurrentUser();
        if (user) {
          console.log('User signed in with Apple:', user);
        }
      } catch (error) {
        console.error('Error getting user in sign in with Apple:', error);
      }
    } catch (error) {
      console.error('Error signing in with Apple:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to WonderPlan</Text>
        <Text style={styles.subtitle}>Your personal task manager</Text>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}>
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleAppleSignIn}>
            <Text style={styles.appleButtonText}>Sign in with Apple</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 16,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  appleButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  appleButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default AuthScreen;
