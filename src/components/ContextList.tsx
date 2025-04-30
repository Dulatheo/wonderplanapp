import React from 'react';
import {FlatList} from 'react-native';
import {TodoItem} from './TodoItem';
import {LocalContext} from '../types/context';

export const ContextList = ({
  contexts,
  onDelete,
}: {
  contexts: LocalContext[];
  onDelete: (item: LocalContext) => void;
}) => (
  <FlatList
    data={contexts}
    renderItem={({item}) => <TodoItem item={item} onDelete={onDelete} />}
    keyExtractor={item => item.id}
  />
);
