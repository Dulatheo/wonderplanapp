import {useNavigation} from '@react-navigation/native';
import {useContexts} from '../hooks/useContexts';
import {View} from 'react-native';
import {TodoForm} from '../components/TodoForm';
import {ContextList} from '../components/ContextList';
import {styles} from '../styles/globalStyles';

export const ContextsListScreen = () => {
  const navigation = useNavigation();
  const {contextsQuery, addMutation, deleteMutation} = useContexts(); // ✅ Now inside the provider

  return (
    <View style={styles.container}>
      <TodoForm
        onSubmit={content => navigation.navigate('Tasks', {contextId: ''})}
      />
      <ContextList
        contexts={contextsQuery.data || []}
        onDelete={item => navigation.navigate('Tasks', {contextId: item.id})}
      />
    </View>
  );
};
