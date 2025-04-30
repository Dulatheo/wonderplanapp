import React, {useState} from 'react';
import {View, TextInput, TouchableOpacity, Text} from 'react-native';
import {styles} from '../styles/globalStyles';

export const TodoForm = ({onSubmit}: {onSubmit: (content: string) => void}) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return; // Explicitly prevent empty submissions
    onSubmit(text.trim());
    setText('');
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Enter context name"
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Create</Text>
      </TouchableOpacity>
    </View>
  );
};
