import React from 'react';
import {TouchableOpacity, Text, View} from 'react-native'; // <-- Add View import
import {styles} from '../styles/globalStyles';
import {LocalContext} from '../types/context';

export const TodoItem = ({
  item,
  onItem,
}: {
  item: LocalContext;
  onItem: (item: LocalContext) => void;
}) => (
  <TouchableOpacity style={styles.listItem} onPress={() => onItem(item)}>
    <Text>{item.name}</Text>
    {item.status === 'pending' && (
      <Text style={styles.pendingText}>Pending</Text>
    )}
    {item.status === 'synced' && <Text style={styles.syncedText}>Synced</Text>}
  </TouchableOpacity>
);
