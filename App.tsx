/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import {Amplify} from 'aws-amplify';
import outputs from './amplify_outputs.json';

import type {Schema} from './amplify/data/resource';
import {generateClient} from 'aws-amplify/data';

const client = generateClient<Schema>();

Amplify.configure(outputs);

const MainApp = () => {
  const [text, setText] = useState('');
  const [todos, setTodos] = useState<Schema['Todo']['type'][]>([]);

  const addItem = async () => {
    await client.models.Todo.create({
      content: text,
    });

    fetchTodos();
  };

  const fetchTodos = async () => {
    const {data: items, errors} = await client.models.Todo.list();
    setTodos(items);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <View style={[styles.container]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter item"
          value={text}
          onChangeText={setText}
          onSubmitEditing={addItem}
        />

        <TouchableOpacity style={styles.button} onPress={addItem}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        renderItem={({item}) => (
          <View style={styles.listItem}>
            <Text>{item.content}</Text>
          </View>
        )}
        keyExtractor={(_, index) => index.toString()}
      />
    </View>
  );
};

export default function App() {
  return <MainApp />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  macContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginVertical: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
