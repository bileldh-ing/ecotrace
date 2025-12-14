import React, { useState } from 'react';
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
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

const VolunteerEventsFeed = ({ navigation }) => {
  const getRandomSousseLocation = () => {
    const points = [
      { latitude: 35.8256, longitude: 10.6084, label: 'Sousse Medina' },
      { latitude: 35.8923, longitude: 10.5853, label: 'Port El Kantaoui' },
      { latitude: 35.8297, longitude: 10.6406, label: 'Sousse Industrial Zone' },
      { latitude: 35.8609, longitude: 10.6032, label: 'Sahloul, Sousse' },
      { latitude: 35.8245, longitude: 10.6346, label: 'Boujaafar Beach' },
    ];
    return points[Math.floor(Math.random() * points.length)];
  };

  const withRandomSousseLocation = () => {
    const loc = getRandomSousseLocation();
    return {
      location: loc.label,
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
  };

  const [events] = useState([
    {
      id: 1,
      title: 'Mountain Fire Emergency Response 🔥',
      priority: 'High',
      priority_color: Colors.priority_high, // #FF4C4C
      description: 'Critical fire containment needed in the nearby mountain sector. Urgent call for volunteers.',
      image_url: require('../assets/fire.jpg'),
      isLocal: true,
      participants: 45,
      reward: 10.0,
      ...withRandomSousseLocation(),
      is_emergency: true,
      severity_level: 10,
    },
    {
      id: 2,
      title: 'Earth Day 2026 Tree Planting 🌱',
      priority: 'Medium',
      priority_color: Colors.priority_medium, // #FFC107
      description: 'Massive tree planting drive to celebrate Earth Day.',
      image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1313&auto=format&fit=crop',
      participants: 128,
      reward: 5.0,
      location: 'Tunis Forest Reserve',
      is_emergency: false,
    },
    {
      id: 3,
      title: 'Ocean Cleanup Initiative 🌊',
      priority: 'Medium',
      priority_color: Colors.priority_medium, // #FFC107
      description: 'Cleaning the local sea and beach from plastic waste and debris.',
      image_url: require('../assets/cleaning.jpg'),
      isLocal: true,
      participants: 87,
      reward: 7.0,
      ...withRandomSousseLocation(),
      is_emergency: false,
    },
    {
      id: 4,
      title: 'Road Hazard Repair 🛣️',
      priority: 'Normal',
      priority_color: Colors.priority_normal, // #00E676
      description: 'Minor road section repair and debris removal. Low risk.',
      image_url: require('../assets/road.jpg'),
      isLocal: true,
      participants: 23,
      reward: 3.0,
      ...withRandomSousseLocation(),
      is_emergency: false,
    },
    {
      id: 5,
      title: 'Fallen Animal Rescue (Cat) 🐱',
      priority: 'High',
      priority_color: Colors.priority_high, // #FF4C4C
      description: 'Injured cat with severe eye infection requires immediate transport and medical attention.',
      image_url: 'https://images.unsplash.com/photo-1567270671170-fdc10a5bf831?q=80&w=1000&auto=format&fit=crop',
      participants: 12,
      reward: 8.0,
      ...withRandomSousseLocation(),
      is_emergency: true,
      severity_level: 8,
    },
  ]);


  const renderEventCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('EventDetail', { event: item })}
      activeOpacity={0.8}
      style={styles.cardWrapper}
    >
      <LinearGradient
        colors={['rgba(46, 204, 113, 0.15)', 'rgba(0, 31, 63, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Image with Overlay */}
        <View style={styles.imageContainer}>
          <Image
            source={typeof item.image_url === 'string' ? { uri: item.image_url } : item.image_url}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />

          {/* Priority Badge */}
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: item.priority_color },
            ]}
          >
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>

          {/* Participants Badge */}
          <View style={styles.participantsBadge}>
            <Text style={styles.participantsText}>👥 {item.participants}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Footer with Reward */}
          <View style={styles.footer}>
            <Text style={styles.rewardLabel}>Earn:</Text>
            <LinearGradient
              colors={Colors.accent_gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rewardPill}
            >
              <Text style={styles.rewardText}>+{item.reward.toFixed(1)} TND</Text>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background_main} />
      <LinearGradient
        colors={['#050505', '#0F1419', '#050505']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../assets/left-arrow.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Volunteer Events</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Events List */}
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />

        {/* Report Emergency FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('ReportEmergency')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.alert_high, '#C0392B']}
            style={styles.fabGradient}
          >
            <Text style={styles.fabIcon}>🚨</Text>
            <Text style={styles.fabText}>Report Emergency</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background_main,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    color: Colors.accent_gradient_end,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text_primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: Colors.background_card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  priorityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  participantsBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  participantsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text_primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: Colors.text_secondary,
    fontWeight: '400',
    marginBottom: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardLabel: {
    fontSize: 12,
    color: Colors.text_secondary,
    fontWeight: '500',
  },
  rewardPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.accent_gradient_end,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.alert_high,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  fabIcon: {
    fontSize: 20,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default VolunteerEventsFeed;

