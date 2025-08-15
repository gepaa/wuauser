import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import { WuauserLogo } from '../components/WuauserLogo';
import { StethoscopeIcon, QRCodeIcon, CommunityIcon } from '../components/OnboardingIcons';
import { Button } from '../components/Button';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  icon: 'stethoscope' | 'qr' | 'community';
}

const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    title: 'Conecta con Veterinarios',
    description: 'Encuentra los mejores veterinarios cerca de ti',
    icon: 'stethoscope',
  },
  {
    id: '2',
    title: 'Protege a tu Mascota',
    description: 'Con nuestro QR, tu mascota siempre podrá volver a casa',
    icon: 'qr',
  },
  {
    id: '3',
    title: 'Únete a la Comunidad',
    description: 'Miles de dueños y profesionales del cuidado animal',
    icon: 'community',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderIcon = (iconType: 'stethoscope' | 'qr' | 'community') => {
    switch (iconType) {
      case 'stethoscope':
        return <StethoscopeIcon size={100} />;
      case 'qr':
        return <QRCodeIcon size={100} />;
      case 'community':
        return <CommunityIcon size={100} />;
      default:
        return <WuauserLogo size={100} />;
    }
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        {renderIcon(item.icon)}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
      
      {renderPagination()}
      
      <View style={styles.buttonContainer}>
        <Button
          title="Saltar"
          onPress={handleSkip}
          variant="outline"
          size="medium"
          style={styles.skipButton}
        />
        <Button
          title={currentIndex === onboardingData.length - 1 ? 'Comenzar' : 'Siguiente'}
          onPress={handleNext}
          variant="primary"
          size="medium"
          style={styles.nextButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  imageContainer: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 16,
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});