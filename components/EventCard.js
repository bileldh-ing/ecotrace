import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const EventCard = ({ event = {}, onPress, isEmergency = false }) => {
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (isEmergency && event.severity_level >= 8) {
      pulseAnim.value = withRepeat(
        withTiming(1.05, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [isEmergency, event.severity_level]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const getCardHeight = () => {
    return 240;
  };

  const getEmergencyColor = () => {
    const level = event.severity_level || 0;
    if (level >= 9) return '#FF1744'; // Red
    if (level >= 7) return '#FF6F00'; // Orange-red
    return Colors.alert_high;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: getCardHeight(),
          borderWidth: isEmergency && event.severity_level >= 8 ? 2 : 0,
          borderColor:
            isEmergency && event.severity_level >= 8
              ? getEmergencyColor()
              : 'transparent',
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <ImageBackground
          source={{
            uri: event.image_url || 'https://via.placeholder.com/400x300',
          }}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          {/* Overlay gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.overlay}
          >
            {/* Emergency badge */}
            {isEmergency && event.severity_level >= 8 && (
              <View style={styles.emergencyBadge}>
                <Icon name="alert-circle" size={16} color="#FFFFFF" />
                <Text style={styles.emergencyText}>EMERGENCY</Text>
              </View>
            )}

            {/* Content container */}
            <View style={styles.contentContainer}>
              {/* Top badges */}
              <View style={styles.topBadges}>
                {event.participants_count && (
                  <View style={styles.badge}>
                    <Icon name="account-multiple" size={14} color="#FFFFFF" />
                    <Text style={styles.badgeText}>
                      {event.participants_count}
                    </Text>
                  </View>
                )}

                {event.reward_amount && (
                  <View style={[styles.badge, styles.rewardBadge]}>
                    <Icon name="star" size={14} color="#FFD700" />
                    <Text style={styles.badgeText}>
                      {event.reward_amount.toFixed(2)} TND
                    </Text>
                  </View>
                )}
              </View>

              {/* Title and description */}
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={2}>
                  {event.title}
                </Text>

                {event.severity_level >= 8 && (
                  <Text style={styles.severity}>
                    Severity: {event.severity_level}/10
                  </Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background_card,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.alert_high,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 1,
  },
  topBadges: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rewardBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  contentContainer: {
    justifyContent: 'flex-end',
  },
  titleContainer: {
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text_primary,
    letterSpacing: 0.5,
  },
  severity: {
    fontSize: 10,
    color: '#FFD700',
    marginTop: 4,
    fontWeight: '600',
  },
});

export default EventCard;
