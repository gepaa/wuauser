import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { Colors } from '../constants/colors';

interface IconProps {
  size?: number;
  color?: string;
}

export const StethoscopeIcon: React.FC<IconProps> = ({ size = 80, color = Colors.primary }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G fill={color} stroke={color} strokeWidth="2" fill="none">
          {/* Stethoscope tubes */}
          <Path d="M 20 25 Q 25 15 35 20 Q 45 25 50 35" strokeWidth="3" />
          <Path d="M 80 25 Q 75 15 65 20 Q 55 25 50 35" strokeWidth="3" />
          
          {/* Main tube */}
          <Path d="M 50 35 L 50 60 Q 50 70 60 70" strokeWidth="3" />
          
          {/* Chest piece */}
          <Circle cx="60" cy="70" r="8" fill={color} />
          <Circle cx="60" cy="70" r="5" fill={Colors.white} />
          
          {/* Ear pieces */}
          <Circle cx="35" cy="20" r="4" fill={color} />
          <Circle cx="65" cy="20" r="4" fill={color} />
        </G>
        
        {/* Medical cross */}
        <G fill={Colors.secondary}>
          <Rect x="22" y="75" width="3" height="12" />
          <Rect x="18" y="79" width="11" height="3" />
        </G>
      </Svg>
    </View>
  );
};

export const QRCodeIcon: React.FC<IconProps> = ({ size = 80, color = Colors.primary }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* QR Code main square */}
        <Rect x="15" y="15" width="70" height="70" fill="none" stroke={color} strokeWidth="3" />
        
        {/* Corner squares */}
        <G fill={color}>
          <Rect x="20" y="20" width="15" height="15" />
          <Rect x="65" y="20" width="15" height="15" />
          <Rect x="20" y="65" width="15" height="15" />
          
          {/* Inner corner squares */}
          <Rect x="25" y="25" width="5" height="5" fill={Colors.white} />
          <Rect x="70" y="25" width="5" height="5" fill={Colors.white} />
          <Rect x="25" y="70" width="5" height="5" fill={Colors.white} />
        </G>
        
        {/* QR pattern dots */}
        <G fill={color}>
          <Rect x="45" y="25" width="3" height="3" />
          <Rect x="55" y="25" width="3" height="3" />
          <Rect x="45" y="35" width="3" height="3" />
          <Rect x="65" y="35" width="3" height="3" />
          <Rect x="25" y="45" width="3" height="3" />
          <Rect x="35" y="45" width="3" height="3" />
          <Rect x="55" y="45" width="3" height="3" />
          <Rect x="75" y="45" width="3" height="3" />
          <Rect x="45" y="55" width="3" height="3" />
          <Rect x="65" y="55" width="3" height="3" />
          <Rect x="35" y="65" width="3" height="3" />
          <Rect x="55" y="65" width="3" height="3" />
        </G>
        
        {/* Shield overlay */}
        <Path 
          d="M 50 10 Q 60 15 65 25 L 65 45 Q 65 55 50 60 Q 35 55 35 45 L 35 25 Q 40 15 50 10" 
          fill={Colors.secondary} 
          opacity="0.8"
        />
        <Path 
          d="M 45 25 L 50 35 L 55 25 L 50 30 Z" 
          fill={Colors.white}
        />
      </Svg>
    </View>
  );
};

export const CommunityIcon: React.FC<IconProps> = ({ size = 80, color = Colors.primary }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* People silhouettes */}
        <G fill={color}>
          {/* Person 1 */}
          <Circle cx="30" cy="25" r="8" />
          <Path d="M 20 45 Q 20 35 30 35 Q 40 35 40 45 L 40 55 Q 40 60 35 60 L 25 60 Q 20 60 20 55 Z" />
          
          {/* Person 2 */}
          <Circle cx="50" cy="20" r="10" />
          <Path d="M 35 50 Q 35 35 50 35 Q 65 35 65 50 L 65 65 Q 65 70 60 70 L 40 70 Q 35 70 35 65 Z" />
          
          {/* Person 3 */}
          <Circle cx="70" cy="25" r="8" />
          <Path d="M 60 45 Q 60 35 70 35 Q 80 35 80 45 L 80 55 Q 80 60 75 60 L 65 60 Q 60 60 60 55 Z" />
        </G>
        
        {/* Pet paws */}
        <G fill={Colors.secondary}>
          {/* Paw 1 */}
          <Circle cx="25" cy="75" r="3" />
          <Circle cx="22" cy="80" r="2" />
          <Circle cx="28" cy="80" r="2" />
          <Circle cx="25" cy="85" r="2" />
          <Circle cx="25" cy="82" r="1.5" />
          
          {/* Paw 2 */}
          <Circle cx="50" cy="80" r="3" />
          <Circle cx="47" cy="85" r="2" />
          <Circle cx="53" cy="85" r="2" />
          <Circle cx="50" cy="90" r="2" />
          <Circle cx="50" cy="87" r="1.5" />
          
          {/* Paw 3 */}
          <Circle cx="75" cy="75" r="3" />
          <Circle cx="72" cy="80" r="2" />
          <Circle cx="78" cy="80" r="2" />
          <Circle cx="75" cy="85" r="2" />
          <Circle cx="75" cy="82" r="1.5" />
        </G>
        
        {/* Connection lines */}
        <G stroke={color} strokeWidth="2" fill="none" opacity="0.6">
          <Path d="M 35 40 Q 42 35 45 40" />
          <Path d="M 55 40 Q 62 35 65 40" />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});