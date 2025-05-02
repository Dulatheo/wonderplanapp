import {useNavigation} from '@react-navigation/native';
import {useContexts} from '../hooks/useContexts';
import {View} from 'react-native';
import {TodoForm} from '../components/TodoForm';
import {ContextList} from '../components/ContextList';
import {styles} from '../styles/globalStyles';

export const ContextsListScreen = () => {
  const navigation = useNavigation();
  const {contextsQuery, addMutation, deleteMutation} = useContexts();

  return (
    <View style={styles.container}>
      <TodoForm onSubmit={content => addMutation.mutate(content)} />
      <ContextList
        contexts={contextsQuery.data || []}
        onItem={item => navigation.navigate('Tasks', {context: item})}
      />
    </View>
  );
};
