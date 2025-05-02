import React from 'react';
import {FlatList} from 'react-native';
import {TodoItem} from './TodoItem';
import {LocalContext} from '../types/context';

export const ContextList = ({
  contexts,
  onItem,
}: {
  contexts: LocalContext[];
  onItem: (item: LocalContext) => void;
}) => (
  <FlatList
    data={contexts}
    renderItem={({item}) => <TodoItem item={item} onItem={onItem} />}
    keyExtractor={item => item.id}
  />
);
