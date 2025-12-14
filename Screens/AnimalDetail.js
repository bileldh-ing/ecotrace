import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { adoptionService } from '../services/adoptionService';
import Colors from '../constants/Colors';

const { width, height } = Dimensions.get('window');

const AnimalDetail = ({ route, navigation }) => {
  const { animal } = route.params;
  const [isSponsoring, setIsSponsoring] = useState(false);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const handleSponsor = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    setIsSponsoring(true);
    try {
      // Create sponsorship
      const result = await adoptionService.createSponsorship(currentUser.uid, animal);

      Alert.alert(
        'Success!',
        `You are now sponsoring ${animal.name}! 🎉\n\n${animal.impactMetric}\n\nMonthly: $${animal.monthlyFee.toFixed(2)}`,
        [
          {
            text: 'View Profile',
            onPress: () => navigation.navigate('Profile'),
          },
          {
            text: 'Continue Browsing',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to sponsor. Please try again.');
      console.error('Sponsorship error:', error);
    } finally {
      setIsSponsoring(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Critical':
        return '#FF4C4C';
      case 'Vulnerable':
        return '#FFA500';
      case 'Protected':
        return '#2ECC71';
      case 'Recovering':
        return '#3B82F6';
      default:
        return '#2ECC71';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" translucent={false} />
      <LinearGradient
        colors={['#050505', '#0F1419', '#050505']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Header Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: animal.image }}
              style={styles.heroImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(5, 5, 5, 0.9)']}
              style={styles.imageGradient}
            />

            {/* Status Badge */}
            <View
              style={[
                styles.heroStatusBadge,
                { backgroundColor: getStatusColor(animal.status) },
              ]}
            >
              <Text style={styles.heroStatusText}>{animal.status}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Name & Species */}
            <Text style={styles.name}>{animal.name}</Text>
            <Text style={styles.species}>{animal.species}</Text>

            {/* Quick Stats */}
            <LinearGradient
              colors={['rgba(46, 204, 113, 0.15)', 'rgba(0, 31, 63, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsContainer}
            >
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>🌍</Text>
                  <Text style={styles.statLabel}>Impact</Text>
                  <Text style={styles.statValue}>{animal.impactMetric}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>💰</Text>
                  <Text style={styles.statLabel}>Monthly</Text>
                  <Text style={styles.statValue}>${animal.monthlyFee}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>👥</Text>
                  <Text style={styles.statLabel}>Tier</Text>
                  <Text style={styles.statValue}>{animal.adoptionLevel}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About {animal.name}</Text>
              <Text style={styles.description}>{animal.description}</Text>
            </View>

            {/* Conservation Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🐾 Pet Care & Support</Text>
              <Text style={styles.bulletPoint}>
                ✓ Quality food and nutrition programs
              </Text>
              <Text style={styles.bulletPoint}>
                ✓ Veterinary care and medical support
              </Text>
              <Text style={styles.bulletPoint}>
                ✓ Safe shelter and comfortable living space
              </Text>
              <Text style={styles.bulletPoint}>
                ✓ Training and behavioral enrichment
              </Text>
            </View>

            {/* Impact Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💚 Your Impact</Text>
              <LinearGradient
                colors={['rgba(46, 204, 113, 0.1)', 'rgba(0, 31, 63, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.impactBox}
              >
                <Text style={styles.impactText}>
                  By sponsoring {animal.name} for ${animal.monthlyFee}/month, you directly support:
                </Text>
                <Text style={styles.impactBullet}>
                  • Monthly food and treats
                </Text>
                <Text style={styles.impactBullet}>
                  • Veterinary care and wellness
                </Text>
                <Text style={styles.impactBullet}>
                  • Safe shelter and comfort
                </Text>
                <Text style={styles.impactBullet}>
                  • Love and attention 🐾
                </Text>
              </LinearGradient>
            </View>

            {/* Sponsor Button */}
            <TouchableOpacity
              onPress={handleSponsor}
              disabled={isSponsoring}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#001F3F', '#2ECC71']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sponsorButton}
              >
                <Text style={styles.sponsorButtonText}>
                  {isSponsoring ? 'Processing...' : `Sponsor ${animal.name} Now`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText}>
              Monthly recurring donation. Cancel anytime in your profile settings.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  container: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButtonText: {
    color: '#2ECC71',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    position: 'relative',
    width: width,
    height: 320,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroStatusBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  heroStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  name: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 4,
  },
  species: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginBottom: 20,
  },
  statsContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2ECC71',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    fontWeight: '400',
  },
  bulletPoint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 8,
  },
  impactBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
    padding: 14,
  },
  impactText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 10,
  },
  impactBullet: {
    fontSize: 12,
    color: '#2ECC71',
    fontWeight: '500',
    marginBottom: 6,
  },
  sponsorButton: {
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sponsorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default AnimalDetail;
