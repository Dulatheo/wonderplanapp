import {RouteProp} from '@react-navigation/native';
import {View, TextInput, TouchableOpacity, Text, FlatList} from 'react-native';
import {styles, getPriorityStyle} from '../styles/globalStyles';
import {getPriorityByValue, PriorityValue} from '../types/task';
import {useTasks} from '../hooks/useTasks';
import {useState} from 'react';
import {createTaskTransaction} from '../services/database/taskDb';
import {PriorityMenuSelector} from '../components/PriorityMenuSelector';

import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Tasks'>;

export const TasksListScreen = ({route}: Props) => {
  const {context} = route.params;
  const {tasksQuery, createTask} = useTasks(context);
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState<PriorityValue>(4);

  const handleCreateTask = () => {
    if (!taskName.trim()) {
      return;
    }

    createTask({
      name: taskName.trim(),
      priority,
      contextIds: [context.id],
    });

    setTaskName('');
    setPriority(4);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter task name"
          value={taskName}
          onChangeText={setTaskName}
          onSubmitEditing={handleCreateTask}
        />

        <PriorityMenuSelector selected={priority} onSelect={setPriority} />

        <TouchableOpacity style={styles.button} onPress={handleCreateTask}>
          <Text style={styles.buttonText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <FlatList
        data={tasksQuery.data || []}
        renderItem={({item}) => (
          <View style={styles.taskItem}>
            <Text>{item.name}</Text>
            <Text style={getPriorityStyle(item.priority)}>
              {getPriorityByValue(item.priority).label}
            </Text>
          </View>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
};
