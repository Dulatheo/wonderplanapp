import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import Modal from 'react-native-modal';
import {FONTS} from '../constants/fonts';
import {COLORS} from '../constants/colors';
import {Shadow} from 'react-native-shadow-2';
import {Color} from 'aws-cdk-lib/aws-cloudwatch';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

interface DescriptionButtonProps {
  leftContent: {
    type: 'icon' | 'symbol';
    value: any;
  };
  label: string;
  isSelected?: boolean;
}

const DEVICE_WIDTH = Dimensions.get('window').width;

const CreateTaskModal = ({visible, onClose}: CreateTaskModalProps) => {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={{margin: 0, justifyContent: 'flex-end'}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <View
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 24,
            paddingHorizontal: 20,
            paddingBottom: 0,
          }}>
          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: FONTS.PROXIMA.SEMIBOLD,
                color: COLORS.TEXT.PRIMARY,
              }}>
              Create Task
            </Text>
            <TouchableOpacity onPress={onClose} style={{padding: 0}}>
              <Image
                source={require('../assets/icons/close.png')}
                style={{width: 24, height: 24}}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Task Name Section */}
          <Text
            style={{
              fontSize: 12,
              color: COLORS.TEXT.SECONDARY,
              marginBottom: 8,
              fontFamily: FONTS.PROXIMA.SEMIBOLD,
            }}>
            Task Name
          </Text>

          {/* Task Input Container */}
          <View
            style={{
              backgroundColor: '#F8F8F8',
              borderRadius: 16,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: '#EEEEEE',
            }}>
            <TextInput
              placeholder="Task name"
              style={{
                fontSize: 16,
                fontFamily: FONTS.PROXIMA.REGULAR,
                color: '#1C1C1E',
                textAlignVertical: 'center',
                minHeight: 42,
                paddingTop: 14,
                paddingBottom: 14,
              }}
              multiline={true}
              numberOfLines={3}
              blurOnSubmit={false}
            />
          </View>

          {/* Description Section */}
          <Text
            style={{
              fontSize: 12,
              color: COLORS.TEXT.SECONDARY,
              marginTop: 16,
              marginBottom: 8,
              fontFamily: FONTS.PROXIMA.SEMIBOLD,
            }}>
            Description
          </Text>

          {/* Descirption Input Container */}
          <View
            style={{
              backgroundColor: '#F8F8F8',
              borderRadius: 16,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: '#EEEEEE',
            }}>
            <TextInput
              placeholder="Enter Here..."
              style={{
                fontSize: 16,
                fontFamily: FONTS.PROXIMA.REGULAR,
                color: '#1C1C1E',
                textAlignVertical: 'center',
                minHeight: 56,
                paddingTop: 14,
                paddingBottom: 14,
              }}
              multiline={true}
              numberOfLines={5}
              blurOnSubmit={false}
            />
          </View>

          {/* Description Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingRight: 40, paddingVertical: 10}}
            style={{
              marginLeft: -20,
              marginRight: -20,
              paddingLeft: 20,
              paddingRight: 20,
            }}>
            <DescriptionButton
              leftContent={{
                type: 'icon',
                value: require('../assets/icons/date.png'),
              }}
              label="Date"
            />
            <DescriptionButton
              leftContent={{
                type: 'icon',
                value: require('../assets/icons/priority.png'),
              }}
              label="Priority"
            />
            <DescriptionButton
              leftContent={{
                type: 'icon',
                value: require('../assets/icons/bell.png'),
              }}
              label="Reminders"
            />
            <DescriptionButton
              leftContent={{
                type: 'icon',
                value: require('../assets/icons/context.png'),
              }}
              label="Context"
            />
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}>
            {/* Inbox Selector with Shadow */}
            <Shadow
              distance={8}
              startColor={'#00000014'}
              offset={[0, 6]}
              containerStyle={{marginRight: 8, marginVertical: 4}}
              style={{borderRadius: 20, width: DEVICE_WIDTH / 2}}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  height: 40,
                  paddingLeft: 4,
                  paddingRight: 12,
                  width: DEVICE_WIDTH / 2,
                }}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#F8F8F8',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 8,
                    }}>
                    <Image
                      source={require('../assets/icons/inbox.png')}
                      style={{
                        width: 20,
                        height: 20,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: COLORS.TEXT.PRIMARY,
                      fontFamily: FONTS.PROXIMA.REGULAR,
                    }}>
                    Inbox
                  </Text>
                </View>
                <Image
                  source={require('../assets/icons/arrows/arrowdown.png')}
                  style={{
                    width: 12,
                    height: 12,
                  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </Shadow>
            {/* Submit Button */}
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#40516d',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Image
                source={require('../assets/icons/up-arrow.png')}
                style={{
                  width: 24,
                  height: 24,
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const DescriptionButton = ({
  leftContent,
  label,
  isSelected,
}: DescriptionButtonProps) => (
  <Shadow
    distance={8}
    startColor={'#00000014'}
    offset={[0, 6]}
    containerStyle={{marginRight: 8, marginVertical: 4}}
    style={{borderRadius: 20}}>
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        height: 40,
        paddingLeft: 4,
        paddingRight: 12,
        borderRadius: 20,
      }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#F0F0F0',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 8,
          marginLeft: 2,
        }}>
        {leftContent.type === 'icon' ? (
          <Image
            source={leftContent.value}
            style={{
              width: 16,
              height: 16,
            }}
            resizeMode="contain"
          />
        ) : (
          <Text
            style={{
              fontSize: 12,
              fontFamily: FONTS.PROXIMA.REGULAR,
              color: leftContent.value === '@' ? '#4CAF50' : '#2196F3',
            }}>
            {leftContent.value}
          </Text>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontSize: 16,
          color: COLORS.TEXT.PRIMARY,
          fontFamily: FONTS.PROXIMA.REGULAR,
        }}>
        {label}
      </Text>
    </TouchableOpacity>
  </Shadow>
);

export default CreateTaskModal;
