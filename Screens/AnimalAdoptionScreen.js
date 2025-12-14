import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import Colors from '../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// Mock animals data - in production, fetch from Firebase
const MOCK_ANIMALS = [
  {
    id: 'animal1',
    name: 'Luna',
    species: 'CAT',
    breed: 'Persian Mix',
    age_months: 8,
    images: ['https://via.placeholder.com/400x300?text=Luna'],
    adoption_fee: 50.00,
    status: 'AVAILABLE',
    description: 'Sweet and playful Persian mix. Loves cuddles!',
  },
  {
    id: 'animal2',
    name: 'Max',
    species: 'DOG',
    breed: 'Golden Retriever',
    age_months: 24,
    images: ['https://via.placeholder.com/400x300?text=Max'],
    adoption_fee: 100.00,
    status: 'AVAILABLE',
    description: 'Friendly and energetic. Perfect family companion.',
  },
  {
    id: 'animal3',
    name: 'Tweet',
    species: 'BIRD',
    breed: 'Canary',
    age_months: 12,
    images: ['https://via.placeholder.com/400x300?text=Tweet'],
    adoption_fee: 30.00,
    status: 'AVAILABLE',
    description: 'Cheerful little singer. Brightens any home!',
  },
];

const AnimalAdoptionScreen = ({ navigation }) => {
  const [animals, setAnimals] = useState(MOCK_ANIMALS);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const handleSwipeLeft = () => {
    if (currentIndex < animals.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleApplyAdopt = (animal) => {
    // In production, would create adoption application
    alert(`Adoption request submitted for ${animal.name}!`);
  };

  if (animals.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="paw" size={48} color={Colors.text_secondary} />
          <Text style={styles.emptyText}>No animals available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const animal = animals[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background_main} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Animals Awaiting Adoption</Text>
        <Text style={styles.headerCounter}>
          {currentIndex + 1} of {animals.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          onPress={handleSwipeLeft}
          style={styles.swipeArea}
        >
          <Image
            source={{ uri: animal.images[0] }}
            style={styles.animalImage}
            resizeMode="cover"
          />

          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.overlay}
          >
            <View style={styles.animalInfo}>
              <Text style={styles.animalName}>{animal.name}</Text>
              <Text style={styles.animalDetails}>
                {animal.breed} • {Math.floor(animal.age_months / 12)} years old
              </Text>
              <Text style={styles.animalDescription}>{animal.description}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.feeContainer}>
        <Text style={styles.feeLabel}>Adoption Fee</Text>
        <Text style={styles.feeAmount}>
          {animal.adoption_fee.toFixed(2)} TND
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={handleSwipeLeft}
          disabled={currentIndex === animals.length - 1}
        >
          <Icon name="close" size={24} color={Colors.alert_high} />
          <Text style={styles.actionText}>Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.adoptButton]}
          onPress={() => handleApplyAdopt(animal)}
        >
          <Icon name="heart" size={24} color="#FFFFFF" />
          <Text style={styles.actionTextWhite}>Adopt</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.swipeHint}>← Swipe left to see more →</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background_main,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text_primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerCounter: {
    color: Colors.accent_gradient_end,
    fontSize: 12,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.background_card,
  },
  swipeArea: {
    flex: 1,
  },
  animalImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  animalInfo: {
    paddingHorizontal: 16,
  },
  animalName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  animalDetails: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginBottom: 8,
  },
  animalDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  feeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background_card,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  feeLabel: {
    color: Colors.text_secondary,
    fontSize: 11,
    fontWeight: '500',
  },
  feeAmount: {
    color: Colors.accent_gradient_end,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  passButton: {
    backgroundColor: 'rgba(255, 76, 76, 0.1)',
    borderWidth: 1,
    borderColor: Colors.alert_high,
  },
  adoptButton: {
    backgroundColor: Colors.animal_purple,
  },
  actionText: {
    color: Colors.alert_high,
    fontSize: 14,
    fontWeight: '600',
  },
  actionTextWhite: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  swipeHint: {
    color: Colors.text_secondary,
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text_secondary,
    fontSize: 14,
    marginTop: 12,
  },
});

export default AnimalAdoptionScreen;
