import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {signOut} from 'aws-amplify/auth';
import type {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';

interface ExploreItem {
  id: string;
  type: number;
  name: string;
}

export const ExploreScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    setItems;
  }, []);

  const [items, setItems] = useState<ExploreItem[]>([
    {
      id: '0',
      type: 0,
      name: 'Inbox',
    },
    {
      id: '1',
      type: 1,
      name: 'Contexts',
    },
    {
      id: '2',
      type: 2,
      name: 'Filters',
    },
  ]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Do not navigate to 'Auth' here; AppNavigator will handle the switch
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={{flex: 1}}>
      <FlatList
        data={items}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => navigation.navigate('Contexts')}>
            <Text style={styles.title}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  listContainer: {
    padding: 16,
    marginHorizontal: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
  },
  leftContent: {
    marginRight: 12,
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
