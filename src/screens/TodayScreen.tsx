import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import {getPriorityByValue, LocalTaskWithDetails} from '../types/task';
import {formatTimestamp} from '../utilities/Date+Extension';
import {useTasks} from '../hooks/useTasks';
import {client} from '../services/amplify';
import {queryClient} from '../services/queryClient';
import {performInitialSync2} from '../services/database';
import {getCurrentUser} from 'aws-amplify/auth';

export const TodayScreen = () => {
  const {tasksQuery} = useTasks();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const sub = client.models.Task.observeQuery().subscribe({
      next: async ({items, isSynced}) => {
        if (isSynced) {
          try {
            await performInitialSync2();
            queryClient.invalidateQueries({queryKey: ['tasks']});
          } catch (error) {
            console.error('Error syncing tasks:', error);
          }
        }
      },
      error: error => {
        console.error('Error in Task subscription:', error);
      },
    });

    return () => sub.unsubscribe();
  }, [ready]);

  const toggleCheckbox = (id: string) => {
    console.log(id);
  };

  const renderItem = ({item}: {item: LocalTaskWithDetails}) => (
    <View style={styles.itemContainer}>
      <View style={styles.leftContent}>
        <TouchableOpacity
          onPress={() => toggleCheckbox(item.id)}
          style={[
            styles.checkbox,
            {borderColor: getPriorityByValue(item.priority).color},
          ]}></TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <Text style={[styles.title]}>{item.name}</Text>
        <Text style={styles.time}>{formatTimestamp(item.created_at)}</Text>
      </View>

      <View style={styles.rightContent}>
        <View style={[styles.tag]}>
          <Text style={styles.tagText}>{item.project_id ?? 'Inbox'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      data={tasksQuery.data || []}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    padding: 0,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
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
  time: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
  priority: {
    fontSize: 16,
    color: '#666',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});

export default TodayScreen;
