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
const cardWidth = (width - 48) / 2;

const AnimalCard = ({ animal, onPress }) => {
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

  const statusColor = getStatusColor(animal.status);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={['rgba(46, 204, 113, 0.15)', 'rgba(0, 31, 63, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: animal.image }}
            style={styles.image}
            defaultSource={require('../assets/nodata.json')}
          />

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor },
            ]}
          >
            <Text style={styles.statusText}>{animal.status}</Text>
          </View>

          {/* Adoption Level Badge */}
          <View style={styles.adoptionBadge}>
            <Text style={styles.adoptionText}>{animal.adoptionLevel}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {animal.name}
          </Text>
          <Text style={styles.species} numberOfLines={1}>
            {animal.species}
          </Text>

          {/* Impact Metric */}
          <View style={styles.impactContainer}>
            <Text style={styles.impactText}>🌍 {animal.impactMetric}</Text>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Monthly</Text>
            <Text style={styles.price}>${animal.monthlyFee.toFixed(2)}</Text>
          </View>

          {/* Adopt Button */}
          <LinearGradient
            colors={['#001F3F', '#2ECC71']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.adoptButton}
          >
            <Text style={styles.adoptButtonText}>Sponsor Now</Text>
          </LinearGradient>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: cardWidth * 0.9,
    backgroundColor: 'rgba(10, 10, 20, 0.5)',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  adoptionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(46, 204, 113, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adoptionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  species: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginBottom: 8,
  },
  impactContainer: {
    marginBottom: 10,
  },
  impactText: {
    fontSize: 11,
    color: '#2ECC71',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2ECC71',
  },
  adoptButton: {
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adoptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default AnimalCard;
