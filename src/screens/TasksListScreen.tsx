import {RouteProp} from '@react-navigation/native';
import {View} from 'react-native';
import {styles} from '../styles/globalStyles';

import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Tasks'>;

export const TasksListScreen = ({route}: Props) => {
  const {contextId} = route.params;

  return <View style={styles.container}></View>;
};
