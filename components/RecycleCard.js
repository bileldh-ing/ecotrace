import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const RecycleCard = ({
  title = 'RECYCLE',
  imagePath = require('../assets/device.png'),
  gradientColors = [Colors.accent_gradient_start, Colors.accent_gradient_end],
  onPress,
  icon = null,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 10,
      mass: 1,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      mass: 1,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.9}
        style={styles.touch}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.borderGradient}
        >
          <View style={styles.innerCard}>
            <View style={styles.contentContainer}>
              <View style={styles.textSection}>
                <Text style={styles.title}>{title}</Text>
              </View>

              <Image
                source={imagePath}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            {/* Overlay gradient from bottom */}
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.overlayGradient}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  touch: {
    flex: 1,
  },
  borderGradient: {
    padding: 2,
    borderRadius: 24,
  },
  innerCard: {
    backgroundColor: Colors.background_card,
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text_primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  image: {
    width: 120,
    height: 120,
    marginRight: -20,
  },
  overlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
  },
});

export default RecycleCard;
