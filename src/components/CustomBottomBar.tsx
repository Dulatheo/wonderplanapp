import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import CreateTaskModal from './CreateTaskModal';

const NAVY = '#2E3A5B';
const GRAY = '#A0A0A0';
const TAB_COUNT = 4;
const INDICATOR_WIDTH = 32;
const INDICATOR_HEIGHT = 4;
const CENTER_TAB_SPACE = 90;

type TabLabel = 'Today' | 'Plan' | 'Search' | 'Explore';

const TAB_ICONS: Record<
  TabLabel,
  {
    active: any;
    inactive: any;
  }
> = {
  Today: {
    active: require('../assets/icons/tabs/today-active.png'),
    inactive: require('../assets/icons/tabs/today-inactive.png'),
  },
  Plan: {
    active: require('../assets/icons/tabs/plan-active.png'),
    inactive: require('../assets/icons/tabs/plan-inactive.png'),
  },
  Search: {
    active: require('../assets/icons/tabs/search-active.png'),
    inactive: require('../assets/icons/tabs/search-inactive.png'),
  },
  Explore: {
    active: require('../assets/icons/tabs/explore-active.png'),
    inactive: require('../assets/icons/tabs/explore-inactive.png'),
  },
};

const TabIcon = ({label, active}: {label: TabLabel; active: boolean}) => (
  <View style={{alignItems: 'center'}}>
    <Image
      source={active ? TAB_ICONS[label].active : TAB_ICONS[label].inactive}
      style={styles.icon}
      resizeMode="contain"
    />
    <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
  </View>
);

const CustomBottomBar = ({state, navigation}: any) => {
  const indicatorAnim = useRef(new Animated.Value(state.index)).current;
  const tabBarWidth = Dimensions.get('window').width;
  const tabWidth = (tabBarWidth - CENTER_TAB_SPACE) / TAB_COUNT;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      useNativeDriver: false,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [state.index]);

  const indicatorWidth = tabWidth * 0.6;
  const getIndicatorLeft = (index: number) => {
    if (index < 2) {
      return index * tabWidth + (tabWidth - indicatorWidth) / 2;
    } else {
      return (
        CENTER_TAB_SPACE + index * tabWidth + (tabWidth - indicatorWidth) / 2
      );
    }
  };

  const indicatorLeft = indicatorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      getIndicatorLeft(0),
      getIndicatorLeft(1),
      getIndicatorLeft(2),
      getIndicatorLeft(3),
    ],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Tabs */}
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => navigation.navigate('Today')}>
          <TabIcon label="Today" active={state.index === 0} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => navigation.navigate('Plan')}>
          <TabIcon label="Plan" active={state.index === 1} />
        </TouchableOpacity>
        <View style={styles.centerTabSpace} />
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => navigation.navigate('Search')}>
          <TabIcon label="Search" active={state.index === 2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => navigation.navigate('Explore')}>
          <TabIcon label="Explore" active={state.index === 3} />
        </TouchableOpacity>
        {/* Animated Indicator */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              left: indicatorLeft,
              width: indicatorWidth,
              height: INDICATOR_HEIGHT,
            },
          ]}
        />
      </View>
      {/* Center Plus Button */}
      <View style={styles.plusButtonWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setModalVisible(true)}>
          <Image
            source={require('../assets/icons/tabs/floating-button-plus.png')}
            style={styles.plusIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      <CreateTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    height: 90,
    marginHorizontal: 0,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  centerTabSpace: {
    width: CENTER_TAB_SPACE, // Space for the plus button
  },
  plusButtonWrapper: {
    position: 'absolute',
    top: -38,
    alignSelf: 'center',
    zIndex: 20,
    borderRadius: 45,
    backgroundColor: 'white',
    width: 90,
    height: 90,
  },
  actionButton: {
    marginTop: 8,
    marginHorizontal: 8,
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    width: 32,
    height: 32,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
  },
  iconActive: {
    backgroundColor: NAVY,
  },
  iconInactive: {
    backgroundColor: GRAY,
    opacity: 0.5,
  },
  label: {
    color: GRAY,
    fontSize: 17,
    marginTop: 2,
    fontWeight: '400',
  },
  activeLabel: {
    color: NAVY,
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: NAVY,
  },
});
export default CustomBottomBar;
