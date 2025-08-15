import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WuauserLogo } from '../components/WuauserLogo';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  navigation: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateIn = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const pulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const timer = setTimeout(() => {
      animateIn();
      pulse();
      setTimeout(() => navigation.replace('UserType'), 3000);
    }, 200);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, textFadeAnim, pulseAnim, navigation]);

  return (
    <LinearGradient
      colors={['#F4B740', '#FFF8E7']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { scale: pulseAnim }
            ],
          },
        ]}
      >
        <WuauserLogo size={150} />
        
        <Animated.View
          style={[
            styles.textContainer,
            { opacity: textFadeAnim }
          ]}
        >
          <Text style={styles.brandText}>WUAUSER</Text>
          
          <Text style={styles.tagline}>
            Cuidando a tu mejor amigo
          </Text>
        </Animated.View>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.footerContainer,
          { opacity: textFadeAnim }
        ]}
      >
        <Text style={styles.madeInMexico}>
          Hecho con ❤️ en México
        </Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  brandText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2A2A2A',
    letterSpacing: 2,
    textShadowColor: '#FFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  madeInMexico: {
    fontSize: 14,
    color: '#6A6A6A',
    textAlign: 'center',
    fontWeight: '400',
  },
});