import React from 'react';
import {
  Modal,
  Box,
  Text,
  Button,
  HStack,
  VStack,
  Center,
  useColorModeValue,
  Pressable,
} from 'native-base';
// import { BlurView } from 'expo-blur'; // Temporarily disabled
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  buttons?: {
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }[];
}

const AnimatedBox = Animated.createAnimatedComponent(Box);

const getIconName = (type: AlertType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'success':
      return 'checkmark-circle';
    case 'error':
      return 'close-circle';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'information-circle';
  }
};

const getIconColor = (type: AlertType): string => {
  switch (type) {
    case 'success':
      return Colors.success;
    case 'error':
      return Colors.error;
    case 'warning':
      return Colors.primary;
    case 'info':
    default:
      return Colors.primary;
  }
};

export const CustomAlert: React.FC<CustomAlertProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK', onPress: onClose }],
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (isOpen) {
      Haptics.notificationAsync(
        type === 'error' 
          ? Haptics.NotificationFeedbackType.Error
          : type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
      
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.8, { duration: 150 });
    }
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.8, { duration: 150 }, () => {
      runOnJS(onClose)();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <Modal.Content bg="transparent" shadow="none">
        <Box
          bg={`${Colors.white}95`}
          borderRadius="16"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          <AnimatedBox
            style={animatedStyle}
            bg={Colors.white}
            borderRadius="16"
            p="6"
            mx="4"
          >
            <VStack space="4" alignItems="center">
              <Center
                w="16"
                h="16"
                bg={`${getIconColor(type)}20`}
                borderRadius="full"
              >
                <Ionicons
                  name={getIconName(type)}
                  size={32}
                  color={getIconColor(type)}
                />
              </Center>

              <VStack space="2" alignItems="center">
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color={Colors.text.primary}
                  textAlign="center"
                >
                  {title}
                </Text>
                
                <Text
                  fontSize="md"
                  color={Colors.text.secondary}
                  textAlign="center"
                  lineHeight="md"
                >
                  {message}
                </Text>
              </VStack>

              <HStack space="3" w="full">
                {buttons.map((button, index) => (
                  <Button
                    key={index}
                    flex={1}
                    variant={button.style === 'cancel' ? 'outline' : 'solid'}
                    bg={
                      button.style === 'destructive'
                        ? Colors.error
                        : button.style === 'cancel'
                        ? 'transparent'
                        : Colors.primary
                    }
                    borderColor={
                      button.style === 'cancel' ? Colors.border : 'transparent'
                    }
                    _text={{
                      color:
                        button.style === 'cancel'
                          ? Colors.text.secondary
                          : Colors.white,
                      fontWeight: 'medium',
                    }}
                    _pressed={{
                      bg:
                        button.style === 'destructive'
                          ? `${Colors.error}90`
                          : button.style === 'cancel'
                          ? `${Colors.border}40`
                          : `${Colors.primary}90`,
                    }}
                    borderRadius="12"
                    h="12"
                    onPress={() => {
                      Haptics.selectionAsync();
                      button.onPress();
                    }}
                  >
                    {button.text}
                  </Button>
                ))}
              </HStack>
            </VStack>
          </AnimatedBox>
        </Box>
      </Modal.Content>
    </Modal>
  );
};

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: AlertType;
    buttons?: CustomAlertProps['buttons'];
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = React.useCallback((config: Omit<typeof alertConfig, 'isOpen'>) => {
    setAlertConfig({ ...config, isOpen: true });
  }, []);

  const hideAlert = React.useCallback(() => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  const AlertComponent = React.useMemo(
    () => (
      <CustomAlert
        {...alertConfig}
        onClose={hideAlert}
      />
    ),
    [alertConfig, hideAlert]
  );

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
};