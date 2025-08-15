import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/colors';

interface WuauserLogoProps {
  size?: number;
  color?: string;
}

export const WuauserLogo: React.FC<WuauserLogoProps> = ({ 
  size = 150, 
  color = '#F4B740' 
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F4B740" stopOpacity="1" />
            <Stop offset="100%" stopColor="#E85D4E" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFF8E7" stopOpacity="1" />
            <Stop offset="100%" stopColor="#F4B740" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        
        {/* Círculo exterior con borde */}
        <Circle
          cx="100"
          cy="100"
          r="95"
          fill="url(#logoGradient)"
          stroke="#E85D4E"
          strokeWidth="3"
        />
        
        {/* Círculo interior */}
        <Circle
          cx="100"
          cy="100"
          r="80"
          fill="url(#innerGradient)"
        />
        
        {/* Hocico de perro estilizado */}
        <G>
          {/* Nariz */}
          <Path
            d="M 100 70 Q 110 75 115 85 Q 110 95 100 90 Q 90 95 85 85 Q 90 75 100 70 Z"
            fill="#2A2A2A"
          />
          
          {/* Boca */}
          <Path
            d="M 100 90 Q 85 105 75 115 Q 80 120 90 115 Q 100 110 100 90"
            fill="none"
            stroke="#2A2A2A"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          <Path
            d="M 100 90 Q 115 105 125 115 Q 120 120 110 115 Q 100 110 100 90"
            fill="none"
            stroke="#2A2A2A"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </G>
        
        {/* Ondas de señal GPS/WiFi */}
        <G opacity="0.7">
          {/* Primera onda */}
          <Path
            d="M 100 45 Q 75 55 65 75 Q 75 95 100 85"
            fill="none"
            stroke="#E85D4E"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          
          <Path
            d="M 100 45 Q 125 55 135 75 Q 125 95 100 85"
            fill="none"
            stroke="#E85D4E"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          
          {/* Segunda onda */}
          <Path
            d="M 100 35 Q 65 50 50 80 Q 65 110 100 95"
            fill="none"
            stroke="#F4B740"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          <Path
            d="M 100 35 Q 135 50 150 80 Q 135 110 100 95"
            fill="none"
            stroke="#F4B740"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </G>
        
        {/* Punto de ubicación en el centro */}
        <Circle
          cx="100"
          cy="130"
          r="8"
          fill="#E85D4E"
        />
        <Circle
          cx="100"
          cy="130"
          r="4"
          fill="#FFF"
        />
        
        {/* Pequeñas huellas de pata decorativas */}
        <G opacity="0.4">
          <Circle cx="65" cy="140" r="3" fill="#E85D4E" />
          <Circle cx="70" cy="145" r="2" fill="#E85D4E" />
          <Circle cx="75" cy="140" r="2" fill="#E85D4E" />
          
          <Circle cx="135" cy="140" r="3" fill="#E85D4E" />
          <Circle cx="130" cy="145" r="2" fill="#E85D4E" />
          <Circle cx="125" cy="140" r="2" fill="#E85D4E" />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
});