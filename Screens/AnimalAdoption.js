import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import AnimalCard from '../components/AnimalCard';
import Colors from '../constants/Colors';


const { width } = Dimensions.get('window');

const AnimalAdoption = ({ navigation }) => {
  const [animals, setAnimals] = useState([
    {
      id: 1,
      name: 'Max',
      species: 'Golden Retriever',
      image: 'https://plus.unsplash.com/premium_photo-1694819488591-a43907d1c5cc?q=80&w=714&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Available',
      description: 'Friendly and energetic dog looking for a loving home with an active family',
      monthlyFee: 20.0,
      impactMetric: '1 Dog Cared For',
      adoptionLevel: 'Foster Parent',
      color: '#D4A574',
    },
    {
      id: 2,
      name: 'Luna',
      species: 'German Shepherd',
      image: 'http://plus.unsplash.com/premium_photo-1666777247416-ee7a95235559?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Available',
      description: 'Loyal and protective companion, perfect for families seeking a devoted friend',
      monthlyFee: 22.0,
      impactMetric: '1 Dog Sheltered',
      adoptionLevel: 'Guardian',
      color: '#8B6914',
    },
    {
      id: 3,
      name: 'Bella',
      species: 'Labrador Mix',
      image: 'https://plus.unsplash.com/premium_photo-1723709014135-117b062f130c?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Available',
      description: 'Sweet and playful pup that loves cuddles and outdoor adventures',
      monthlyFee: 18.0,
      impactMetric: '1 Dog Supported',
      adoptionLevel: 'Friend',
      color: '#A0522D',
    },
    {
      id: 4,
      name: 'Charlie',
      species: 'Beagle',
      image: 'https://images.unsplash.com/photo-1575859431774-2e57ed632664?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Available',
      description: 'Curious and affectionate, loves playtime and making new friends',
      monthlyFee: 16.0,
      impactMetric: '1 Dog Nurtured',
      adoptionLevel: 'Friend',
      color: '#8B4513',
    },
    {
      id: 5,
      name: 'Whiskers',
      species: 'Bengal Cat',
      image: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?q=80&w=601&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Available',
      description: 'Intelligent and playful feline seeking a cozy home with lots of entertainment',
      monthlyFee: 15.0,
      impactMetric: '1 Cat Cared For',
      adoptionLevel: 'Cat Lover',
      color: '#D2691E',
    },
    {
      id: 6,
      name: 'Shadow',
      species: 'Black Cat',
      image: 'https://plus.unsplash.com/premium_photo-1673967831980-1d377baaded2?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Available',
      description: 'Graceful and mysterious, loves sunny windowsills and gentle pets',
      monthlyFee: 14.0,
      impactMetric: '1 Cat Rescued',
      adoptionLevel: 'Cat Guardian',
      color: '#2F2F2F',
    },
    {
      id: 7,
      name: 'Mittens',
      species: 'Tabby Cat',
      image: 'https://images.unsplash.com/photo-1518288774672-b94e808873ff?q=80&w=738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Available',
      description: 'Adorable and cuddly kitten with a playful personality and soft purr',
      monthlyFee: 12.0,
      impactMetric: '1 Cat Loved',
      adoptionLevel: 'Friend',
      color: '#CD853F',
    },
    {
      id: 8,
      name: 'Tiger',
      species: 'Orange Tabby',
      image: 'https://images.unsplash.com/photo-1598935888738-cd2622bcd437?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Available',
      description: 'Energetic and affectionate companion perfect for active households',
      monthlyFee: 13.0,
      impactMetric: '1 Cat Sheltered',
      adoptionLevel: 'Guardian',
      color: '#FF8C00',
    },
    {
      id: 9,
      name: 'Daisy',
      species: 'Labrador',
      image: 'https://images.unsplash.com/photo-1678153184494-1f6fc14a673d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Available',
      description: 'Gentle and well-trained, loves fetch and swimming in the park',
      monthlyFee: 21.0,
      impactMetric: '1 Dog Loved',
      adoptionLevel: 'Guardian',
      color: '#D4A574',
    },
    {
      id: 10,
      name: 'Smokey',
      species: 'Gray Cat',
      image: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Available',
      description: 'Calm and serene kitty that enjoys quiet moments and cozy laps',
      monthlyFee: 13.0,
      impactMetric: '1 Cat Supported',
      adoptionLevel: 'Friend',
      color: '#A9A9A9',
    },
  ]);

  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const handleAdopt = (animal) => {
    setSelectedAnimal(animal);
    navigation.navigate('AnimalDetail', { animal });
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Animal Adoption</Text>
          <Text style={styles.headerSubtitle}>Save endangered species through sponsorship</Text>
        </View>

        {/* Stats Bar */}
        <LinearGradient
          colors={['rgba(46, 204, 113, 0.1)', 'rgba(0, 31, 63, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsBar}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{animals.length}</Text>
            <Text style={styles.statLabel}>Pets</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Adopted</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.8★</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </LinearGradient>

        {/* Animals Grid */}
        <FlatList
          data={animals}
          renderItem={({ item }) => (
            <AnimalCard animal={item} onPress={() => handleAdopt(item)} />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={animals.length > 0 ? styles.columnWrapper : null}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={animals.length === 0 ? styles.emptyListContent : styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <LottieView
                source={require('../assets/animals.json')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
              <Text style={styles.emptyTitle}>No Animals Available</Text>
              <Text style={styles.emptySubtitle}>
                Check back soon for rescue and adoption opportunities!
              </Text>
            </View>
          )}
        />
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
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2ECC71',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    marginHorizontal: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lottieAnimation: {
    width: 250,
    height: 250,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text_primary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text_secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default AnimalAdoption;

