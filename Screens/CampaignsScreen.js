import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getCampaigns, createCampaign, updateCampaign } from '../services/ecoService';
import { uploadCampaignImage } from '../utils/uploadToSupabase';
import Colors from '../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const CampaignsScreen = ({ navigation }) => {
  const [campaigns, setcampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newCategory, setNewCategory] = useState('OTHER');
  const [newPriority, setNewPriority] = useState('Normal');
  const [newImage, setNewImage] = useState(null);
  const [newLocation, setNewLocation] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await getCampaigns();
      setcampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (campaign) => {
    const goal = Number(campaign?.goal_amount || 0);
    const current = Number(campaign?.current_amount || 0);
    if (!Number.isFinite(goal) || goal <= 0) return 0;
    if (!Number.isFinite(current) || current <= 0) return 0;
    return (current / goal) * 100;
  };

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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });
      if (!result.canceled) {
        setNewImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking campaign image:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });
      if (!result.canceled) {
        setNewImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking campaign photo:', error);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNewLocation(getRandomSousseLocation());
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setNewLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        label: 'Current Location',
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setNewLocation(getRandomSousseLocation());
    }
  };

  const resetCreateForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewGoal('');
    setNewCategory('OTHER');
    setNewPriority('Normal');
    setNewImage(null);
    setNewLocation(null);
  };

  const submitCampaign = async () => {
    try {
      if (!currentUser?.uid) return;
      if (!newTitle.trim() || !newDescription.trim() || !newGoal.trim()) return;

      const goalAmount = Number(newGoal);
      if (!Number.isFinite(goalAmount) || goalAmount <= 0) return;

      setSubmitting(true);

      const campaignId = await createCampaign({
        creator_id: currentUser.uid,
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        priority: newPriority,
        goal_amount: goalAmount,
        image_url: null,
        latitude: newLocation?.latitude ?? null,
        longitude: newLocation?.longitude ?? null,
        location_label: newLocation?.label ?? null,
      });

      if (newImage?.base64) {
        const url = await uploadCampaignImage(newImage.base64, campaignId);
        await updateCampaign(campaignId, { image_url: url });
      }

      setCreateOpen(false);
      resetCreateForm();
      await loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      ANIMAL_WELFARE: 'paw',
      TREE_PLANTING: 'tree',
      OCEAN_CLEANUP: 'water',
      FOREST_CONSERVATION: 'pine-tree',
      OTHER: 'leaf',
    };
    return icons[category] || 'leaf';
  };

  const renderCampaignCard = ({ item }) => {
    const progress = getProgressPercentage(item);
    const isFunded = item.status === 'FUNDED';

    return (
      <TouchableOpacity
        style={styles.campaignCard}
        onPress={() =>
          navigation.navigate('CampaignDetail', { campaignId: item.id })
        }
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: item.image_url || 'https://via.placeholder.com/400x200',
            }}
            style={styles.campaignImage}
            resizeMode="cover"
          />

          {isFunded && (
            <View style={styles.fundedBadge}>
              <Icon name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.fundedText}>FUNDED</Text>
            </View>
          )}

          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Icon
              name={getCategoryIcon(item.category)}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>

        <View style={styles.campaignContent}>
          <Text style={styles.campaignTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.campaignDesc} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={[Colors.accent_gradient_start, Colors.accent_gradient_end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.toFixed(0)}% funded
            </Text>
          </View>

          {/* Amount info */}
          <View style={styles.amountContainer}>
            <View>
              <Text style={styles.amountLabel}>Raised</Text>
              <Text style={styles.amountValue}>
                {item.current_amount.toFixed(2)} TND
              </Text>
            </View>
            <View style={styles.amountDivider} />
            <View>
              <Text style={styles.amountLabel}>Goal</Text>
              <Text style={styles.amountValue}>
                {item.goal_amount.toFixed(2)} TND
              </Text>
            </View>
            <View style={styles.amountDivider} />
            <View>
              <Text style={styles.amountLabel}>Donors</Text>
              <Text style={styles.amountValue}>{item.donor_count}</Text>
            </View>
          </View>

          {/* Donate Button */}
          <TouchableOpacity
            style={[
              styles.donateButton,
              isFunded && styles.donateButtonDisabled,
            ]}
            onPress={() =>
              navigation.navigate('CampaignDetail', {
                campaignId: item.id,
                action: 'donate',
              })
            }
            disabled={isFunded}
          >
            <LinearGradient
              colors={
                isFunded
                  ? ['#666666', '#444444']
                  : [Colors.accent_gradient_start, Colors.accent_gradient_end]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.donateButtonGradient}
            >
              <Icon name="heart" size={16} color="#FFFFFF" />
              <Text style={styles.donateButtonText}>
                {isFunded ? 'Campaign Completed' : 'Donate Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent_gradient_end} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background_main} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campaigns</Text>
        <Text style={styles.headerSubtitle}>Support eco-friendly initiatives</Text>
      </View>

      {/* Campaigns List */}
      {campaigns.length > 0 ? (
        <FlatList
          data={campaigns}
          renderItem={renderCampaignCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={loadCampaigns}
          refreshing={loading}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon
            name="heart-outline"
            size={48}
            color={Colors.text_secondary}
          />
          <Text style={styles.emptyText}>No campaigns available</Text>
          <Text style={styles.emptySubtext}>
            Check back soon for new campaigns to support
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateOpen(true)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[Colors.accent_gradient_end, Colors.accent_gradient_start]}
          style={styles.fabGradient}
        >
          <Icon name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.fabText}>New Campaign</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={createOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalCard}
          >
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Campaign</Text>
                <TouchableOpacity onPress={() => setCreateOpen(false)}>
                  <Icon name="close" size={20} color={Colors.text_secondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.85}>
                {newImage?.uri ? (
                  <Image source={{ uri: newImage.uri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Icon name="image" size={26} color={Colors.text_secondary} />
                    <Text style={styles.imagePlaceholderText}>Add Cover Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.imageActions}>
                <TouchableOpacity style={styles.smallAction} onPress={takePhoto}>
                  <Icon name="camera" size={16} color={Colors.text_primary} />
                  <Text style={styles.smallActionText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallAction} onPress={pickImage}>
                  <Icon name="folder-image" size={16} color={Colors.text_primary} />
                  <Text style={styles.smallActionText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Campaign title"
                placeholderTextColor={Colors.text_muted}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Describe your campaign"
                placeholderTextColor={Colors.text_muted}
                multiline
              />

              <Text style={styles.inputLabel}>Goal (TND)</Text>
              <TextInput
                style={styles.input}
                value={newGoal}
                onChangeText={setNewGoal}
                placeholder="e.g. 500"
                placeholderTextColor={Colors.text_muted}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.chipsRow}>
                {['ANIMAL_WELFARE', 'TREE_PLANTING', 'OCEAN_CLEANUP', 'FOREST_CONSERVATION', 'OTHER'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, newCategory === c && styles.chipActive]}
                    onPress={() => setNewCategory(c)}
                  >
                    <Text style={[styles.chipText, newCategory === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.chipsRow}>
                {['High', 'Medium', 'Normal'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, newPriority === p && styles.chipActive]}
                    onPress={() => setNewPriority(p)}
                  >
                    <Text style={[styles.chipText, newPriority === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.locationButton} onPress={getLocation}>
                <Icon name="map-marker" size={16} color={Colors.accent_gradient_end} />
                <Text style={styles.locationButtonText}>
                  {newLocation?.label ? `Location: ${newLocation.label}` : 'Get Location'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                onPress={submitCampaign}
                disabled={submitting}
              >
                <LinearGradient
                  colors={[Colors.accent_gradient_start, Colors.accent_gradient_end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Submitting...' : 'Submit Campaign'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background_main,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: Colors.text_primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: Colors.text_secondary,
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  campaignCard: {
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background_card,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  campaignImage: {
    width: '100%',
    height: '100%',
  },
  fundedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fundedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  campaignContent: {
    padding: 16,
  },
  campaignTitle: {
    color: Colors.text_primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  campaignDesc: {
    color: Colors.text_secondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: Colors.text_secondary,
    fontSize: 11,
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  amountLabel: {
    color: Colors.text_secondary,
    fontSize: 10,
    fontWeight: '500',
  },
  amountValue: {
    color: Colors.text_primary,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  amountDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  donateButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  donateButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  donateButtonDisabled: {
    opacity: 0.6,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text_primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: Colors.text_secondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '92%',
    backgroundColor: Colors.background_main,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.18)',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: Colors.text_primary,
    fontSize: 18,
    fontWeight: '800',
  },
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background_card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imagePlaceholderText: {
    color: Colors.text_secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  smallActionText: {
    color: Colors.text_primary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    color: Colors.text_secondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text_primary,
    fontSize: 14,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(46, 204, 113, 0.18)',
    borderColor: 'rgba(46, 204, 113, 0.35)',
  },
  chipText: {
    color: Colors.text_secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.text_primary,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.22)',
  },
  locationButtonText: {
    color: Colors.accent_gradient_end,
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default CampaignsScreen;
