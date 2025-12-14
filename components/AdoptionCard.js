import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AdoptionCard = ({ onPress, recentAdoptions = 3 }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={['rgba(46, 204, 113, 0.2)', 'rgba(0, 31, 63, 0.2)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>ADOPT & PROTECT</Text>
            <Text style={styles.subtitle}>
              Sponsor endangered animals
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{recentAdoptions}</Text>
                <Text style={styles.statLabel}>Recent</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>12K+</Text>
                <Text style={styles.statLabel}>Sponsors</Text>
              </View>
            </View>
          </View>

          {/* Emoji Animals */}
          <View style={styles.animalEmojis}>
            <Text style={styles.emoji}>🐘</Text>
            <Text style={styles.emoji}>🐯</Text>
            <Text style={styles.emoji}>🐢</Text>
          </View>
        </View>

        {/* Bottom Accent */}
        <View style={styles.bottomAccent} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(46, 204, 113, 0.4)',
    overflow: 'hidden',
    marginHorizontal: 20,
    marginVertical: 12,
    shadowColor: 'rgba(46, 204, 113, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2ECC71',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  animalEmojis: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 12,
  },
  emoji: {
    fontSize: 32,
  },
  bottomAccent: {
    height: 3,
    backgroundColor: 'rgba(46, 204, 113, 0.4)',
  },
});

export default AdoptionCard;
