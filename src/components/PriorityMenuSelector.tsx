import {useState} from 'react';
import {Menu, Text, TouchableRipple, useTheme} from 'react-native-paper';
import {View, StyleSheet} from 'react-native';
import {PriorityLevel, PriorityValue, PRIORITY_MAP} from '../types/task';

export const PriorityMenuSelector = ({
  selected,
  onSelect,
}: {
  selected: PriorityValue;
  onSelect: (value: PriorityValue) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const selectedPriority =
    Object.values(PRIORITY_MAP).find(p => p.value === selected) ||
    PRIORITY_MAP.low;

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TouchableRipple
            onPress={() => setVisible(true)}
            style={[styles.anchor, {borderColor: theme.colors.outline}]}>
            <View style={styles.anchorContent}>
              <View
                style={[styles.dot, {backgroundColor: selectedPriority.color}]}
              />
              <Text variant="bodyMedium">{selectedPriority.label}</Text>
            </View>
          </TouchableRipple>
        }>
        {Object.entries(PRIORITY_MAP).map(([key, {label, value, color}]) => (
          <Menu.Item
            key={key}
            title={label}
            style={styles.menuItem}
            titleStyle={{color}}
            onPress={() => {
              onSelect(value);
              setVisible(false);
            }}
            leadingIcon={() => (
              <View style={[styles.dot, {backgroundColor: color}]} />
            )}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  anchor: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  anchorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  menuItem: {
    maxWidth: 200,
  },
});
