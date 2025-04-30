import React from 'react';
import {TouchableOpacity, Text, View} from 'react-native'; // <-- Add View import
import {styles} from '../styles/globalStyles';
import {LocalContext} from '../types/context';

export const TodoItem = ({
  item,
  onDelete,
}: {
  item: LocalContext;
  onDelete: (item: LocalContext) => void;
}) => (
  <TouchableOpacity style={styles.listItem} onPress={() => onDelete(item)}>
    <Text>{item.name}</Text>
    {item.status === 'pending' && (
      <Text style={styles.pendingText}>Pending</Text>
    )}
    {item.status === 'synced' && <Text style={styles.syncedText}>Synced</Text>}
  </TouchableOpacity>
);
