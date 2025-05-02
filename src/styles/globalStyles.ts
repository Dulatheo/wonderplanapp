import {StyleSheet, TextStyle} from 'react-native';
import {PriorityValue, getPriorityByValue} from '../types/task';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
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
  pendingText: {
    color: '#ffc107',
    fontSize: 12,
  },
  syncedText: {
    color: '#28a745',
    fontSize: 12,
  },
  formContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  taskItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export const getPriorityStyle = (priority: PriorityValue): TextStyle => ({
  color: getPriorityByValue(priority).color,
  fontWeight: 'bold' as const,
  fontSize: 12,
});
