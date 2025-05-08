import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

interface ExploreItem {
  id: string;
  type: number;
  name: string;
}

export const ExploreScreen = () => {
  const navigation = useNavigation();

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

  return (
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
});
