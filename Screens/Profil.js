import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { getAuth, signOut, deleteUser } from 'firebase/auth';
import { firebaseDatabase } from '../config';
import { ref, onValue, update, remove, push, set } from 'firebase/database';
import { supabase } from '../config/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { getUserWallet } from '../services/ecoService';
import Colors from '../constants/Colors';

const Profil = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '' });
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0);
  const [impactStats, setImpactStats] = useState({ trees: 0, animals: 0, items: 0 });

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackSection, setShowFeedbackSection] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);


  const auth = getAuth();

  // Theme colors
  const theme = {
    dark: {
      bg1: '#050505',
      bg2: '#0F1419',
      bg3: '#1A2332',
      text: '#E2E8F0',
      textSecondary: 'rgba(148, 163, 184, 0.8)',
      accent: '#2ECC71',
      card: 'rgba(30, 41, 59, 0.6)',
    },
    light: {
      bg1: '#F8FAFC',
      bg2: '#F1F5F9',
      bg3: '#E2E8F0',
      text: '#1E293B',
      textSecondary: 'rgba(71, 85, 105, 0.8)',
      accent: '#667eea',
      card: 'rgba(255, 255, 255, 0.9)',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);

      // Listen to user data
      const userRef = ref(firebaseDatabase, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserData(data);
          if (data.image) setProfileImage(data.image);
          if (data.status) setIsActive(data.status === 'online');
          setEditData({
            name: data.name || data.username || '',
            phone: data.phone || '',
          });
        }
      });

      // Load wallet data
      loadWalletData(user.uid);

      // Set current user as online
      try {
        update(userRef, { status: 'online', lastSeen: Date.now() });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }
  }, []);

  // Load wallet balance and impact stats
  const loadWalletData = async (userId) => {
    try {
      const wallet = await getUserWallet(userId);
      if (wallet) {
        setWalletBalance(wallet.wallet_balance || 0);
        setImpactStats({
          trees: wallet.trees_planted || 0,
          animals: wallet.animals_saved || 0,
          items: wallet.total_recycled_items || 0,
        });
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };


  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => { } },
      {
        text: 'Logout',
        onPress: async () => {
          setLoading(true);
          try {
            if (currentUser) {
              const userRef = ref(firebaseDatabase, `users/${currentUser.uid}`);
              await update(userRef, { status: 'offline', lastSeen: Date.now() });
            }

            await signOut(auth);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Authentication' }],
            });
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
            setLoading(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  // Toggle active status
  const handleStatusToggle = async (value) => {
    setIsActive(value);
    if (currentUser) {
      try {
        const userRef = ref(firebaseDatabase, `users/${currentUser.uid}`);
        await update(userRef, {
          status: value ? 'online' : 'offline',
          lastSeen: Date.now()
        });
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
  };

  // Toggle dark/light mode
  const handleThemeToggle = (value) => {
    setIsDarkMode(value);
  };

  // Save profile edits
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const userRef = ref(firebaseDatabase, `users/${currentUser.uid}`);
      await update(userRef, {
        name: editData.name,
        phone: editData.phone,
      });
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLongPressAccount = () => {
    setShowEditModal(true);
  };

  // Get feedback emoji and message based on rating
  const getFeedbackResponse = (rating) => {
    switch (rating) {
      case 5:
        return {
          emoji: '🚀🔥😎',
          message: 'To infinity and beyond!',
          color: '#22C55E'
        };
      case 4:
        return {
          emoji: '🤩',
          message: "You're a legend! Wow!",
          color: '#22C55E'
        };
      case 3:
        return {
          emoji: '😁',
          message: 'Almost perfect! Go on.',
          color: '#F59E0B'
        };
      case 2:
        return {
          emoji: '😐',
          message: 'Meh. We need help.',
          color: '#EF4444'
        };
      case 1:
        return {
          emoji: '😣',
          message: 'Ouch! Tell us why.',
          color: '#EF4444'
        };
      default:
        return { emoji: '', message: '', color: '#667eea' };
    }
  };

  // Submit feedback to Firebase
  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const feedbackRef = ref(firebaseDatabase, 'app_feedback');
      const newFeedbackRef = push(feedbackRef);
      await set(newFeedbackRef, {
        id: newFeedbackRef.key,
        userId: currentUser?.uid,
        rating: feedbackRating,
        comment: feedbackText.trim(),
        timestamp: Date.now(),
      });

      const response = getFeedbackResponse(feedbackRating);
      Alert.alert(
        `${response.emoji}`,
        response.message,
        [{
          text: 'OK', onPress: () => {
            setFeedbackRating(0);
            setFeedbackText('');
            setShowFeedbackSection(false);
          }
        }]
      );
    } catch (error) {
      console.error('Submit feedback error:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        setDeleting(false);
        return;
      }

      // Delete user data from Firebase
      await remove(ref(firebaseDatabase, `users/${user.uid}`));
      await remove(ref(firebaseDatabase, `contacts/${user.uid}`));
      await remove(ref(firebaseDatabase, `friends/${user.uid}`));
      await remove(ref(firebaseDatabase, `friendRequests/${user.uid}`));
      await remove(ref(firebaseDatabase, `stories/${user.uid}`));

      // Delete Firebase Auth account
      await deleteUser(user);

      setShowDeleteModal(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Authentication' }],
      });
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Error', 'Failed to delete account. You may need to re-login first.');
      setDeleting(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.5,
        base64: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]?.base64 && currentUser) {
        setUploadingImage(true);

        try {
          const fileName = `profile_${currentUser.uid}_${Date.now()}.jpg`;
          const base64Data = result.assets[0].base64;

          const { data, error } = await supabase.storage
            .from('chat-assets') // Correct bucket
            .upload(fileName, decode(base64Data), {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (error) throw error;

          const { data: publicUrlData } = supabase.storage
            .from('chat-assets')
            .getPublicUrl(fileName);

          const publicUrl = publicUrlData.publicUrl;

          const userRef = ref(firebaseDatabase, `users/${currentUser.uid}`);
          await update(userRef, { image: publicUrl });

          setProfileImage(publicUrl);
          Alert.alert('Success', 'Profile picture updated!');
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload image');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to access photos');
    }
  };

  return (
    <LinearGradient
      colors={[colors.bg1, colors.bg2, colors.bg3]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          </View>

          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploadingImage}
              style={styles.imageContainer}
            >
              {uploadingImage ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={colors.accent} />
                </View>
              ) : (
                <Image
                  source={profileImage ? { uri: profileImage } : require('../assets/no-photo.png')}
                  style={styles.profileImage}
                  resizeMode={profileImage ? "cover" : "contain"}
                />
              )}
              {/* Premium Purple Camera Circle */}
              <View style={styles.cameraButton}>
                <Image
                  source={require('../assets/camera.png')}
                  style={styles.cameraIcon}
                />
              </View>
            </TouchableOpacity>

            <Text style={[styles.userName, { color: colors.text }]}>
              {userData?.name || userData?.username || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {currentUser?.email}
            </Text>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)' }]}>
              <View style={[styles.statusDot, { backgroundColor: isActive ? '#22C55E' : '#64748B' }]} />
              <Text style={[styles.statusText, { color: isActive ? '#22C55E' : '#64748B' }]}>
                {isActive ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          {/* Wallet Balance Card */}
          <TouchableOpacity
            style={[styles.walletCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('WalletScreen')}
          >
            <LinearGradient
              colors={[Colors.accent_gradient_start, Colors.accent_gradient_end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.walletGradient}
            >
              <View style={styles.walletContent}>
                <Text style={styles.walletLabel}>💰 Wallet Balance</Text>
                <Text style={styles.walletAmount}>{walletBalance.toFixed(2)} TND</Text>
              </View>
              <View style={styles.walletStats}>
                <View style={styles.walletStatItem}>
                  <Text style={styles.walletStatValue}>{impactStats.trees}</Text>
                  <Text style={styles.walletStatLabel}>🌳 Trees</Text>
                </View>
                <View style={styles.walletStatItem}>
                  <Text style={styles.walletStatValue}>{impactStats.animals}</Text>
                  <Text style={styles.walletStatLabel}>🐾 Animals</Text>
                </View>
                <View style={styles.walletStatItem}>
                  <Text style={styles.walletStatValue}>{impactStats.items}</Text>
                  <Text style={styles.walletStatLabel}>♻️ Items</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Settings Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SETTINGS</Text>
          </View>

          {/* Active Status Toggle */}
          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Active Status</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {isActive ? 'Visible to others' : 'Appear offline'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={handleStatusToggle}
                trackColor={{ false: '#64748B', true: colors.accent }}
                thumbColor={isActive ? '#FFFFFF' : '#94A3B8'}
              />
            </View>
          </View>

          {/* Dark/Light Mode Toggle */}
          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {isDarkMode ? 'Dark theme active' : 'Light theme active'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={handleThemeToggle}
                trackColor={{ false: '#64748B', true: colors.accent }}
                thumbColor={isDarkMode ? '#FFFFFF' : '#94A3B8'}
              />
            </View>
          </View>

          {/* Account Info - Long Press to Edit */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT INFO (HOLD TO EDIT)</Text>
          </View>

          <TouchableOpacity
            onLongPress={handleLongPressAccount}
            activeOpacity={0.8}
          >
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{currentUser?.email}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{userData?.phone || 'Not set'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Member since</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIONS</Text>
          </View>

          {/* Rate App Section - Static Always Visible Box */}
          <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.ratingCardTitle, { color: colors.text }]}>Rate Our App ⭐</Text>

            {/* Star Rating */}
            <View style={styles.ratingStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setFeedbackRating(star)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={star <= feedbackRating
                      ? require('../assets/star_pressed.png')
                      : require('../assets/star.png')}
                    style={styles.starImage}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Dynamic Emoji Response */}
            {feedbackRating > 0 && (
              <View style={styles.ratingFeedbackRow}>
                <Text style={styles.ratingEmoji}>{getFeedbackResponse(feedbackRating).emoji}</Text>
                <Text style={[styles.ratingMessage, { color: getFeedbackResponse(feedbackRating).color }]}>
                  {getFeedbackResponse(feedbackRating).message}
                </Text>
              </View>
            )}

            {/* Feedback Text Input */}
            <TextInput
              style={[styles.ratingInput, { color: colors.text, borderColor: 'rgba(100, 116, 139, 0.3)' }]}
              placeholder="Any feedback? (optional)"
              placeholderTextColor={colors.textSecondary}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={2}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.ratingSubmitButton}
              onPress={handleSubmitFeedback}
              disabled={submittingFeedback || feedbackRating === 0}
            >
              <LinearGradient
                colors={feedbackRating > 0 ? ['#667eea', '#764ba2'] : ['#475569', '#475569']}
                style={styles.ratingSubmitGradient}
              >
                {submittingFeedback ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.ratingSubmitText}>Submit</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.logoutGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Image
                    source={require('../assets/logout.png')}
                    style={styles.logoutIcon}
                  />
                  <Text style={styles.logoutText}>Logout</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Delete Account Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.8}
          >
            <Image
              source={require('../assets/delete.png')}
              style={styles.deleteIcon}
            />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.editModalContainer}
          >
            <View style={[styles.editModalContent, { backgroundColor: colors.bg3 }]}>
              <Text style={[styles.editModalTitle, { color: colors.text }]}>Update Profile</Text>
              <Text style={[styles.editModalSubtitle, { color: colors.textSecondary }]}>
                Update your personal information
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Display Name</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: 'rgba(100, 116, 139, 0.4)' }]}
                  value={editData.name}
                  onChangeText={(text) => setEditData({ ...editData, name: text })}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: 'rgba(100, 116, 139, 0.4)' }]}
                  value={editData.phone}
                  onChangeText={(text) => setEditData({ ...editData, phone: text })}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={styles.editCancelButton}
                  onPress={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  <Text style={styles.editCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editSaveButton}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.editSaveGradient}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.editSaveText}>Save Changes</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <LottieView
              source={require('../assets/warning.json')}
              autoPlay
              loop
              style={styles.warningAnimation}
            />
            <Text style={styles.deleteModalTitle}>Delete Account?</Text>
            <Text style={styles.deleteModalDesc}>
              This will permanently delete your account, all conversations, and shared pictures. This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#050505',
  },
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  loaderContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#667eea',
    backgroundColor: '#0F172A',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0A192F',
    backgroundColor: '#0F172A', // Dark circle
  },
  cameraIcon: {
    width: 20,
    height: 20,
    tintColor: '#667eea', // Purple icon
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  settingCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 13,
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  logoutIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 10,
  },
  deleteIcon: {
    width: 18,
    height: 18,
    tintColor: '#EF4444',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Edit Modal Styles
  editModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  editModalContent: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  editModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  editModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
  },
  editCancelText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  editSaveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Delete Modal
  deleteModalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  warningAnimation: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
  },
  deleteModalDesc: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Feedback Section Styles
  feedbackContainer: {
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  feedbackLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starText: {
    fontSize: 36,
  },
  starImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  emojiResponseContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emojiResponse: {
    fontSize: 32,
    marginBottom: 4,
  },
  emojiMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 16,
  },
  feedbackSubmitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  feedbackSubmitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  feedbackSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Static Rating Card Styles
  ratingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  ratingCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  ratingStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  ratingEmoji: {
    fontSize: 24,
  },
  ratingMessage: {
    fontSize: 13,
    fontWeight: '600',
  },
  ratingInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 50,
    textAlignVertical: 'top',
    fontSize: 13,
    marginBottom: 12,
  },
  ratingSubmitButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  ratingSubmitGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ratingSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Wallet Card Styles
  walletCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  walletGradient: {
    padding: 20,
  },
  walletContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  walletLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 8,
  },
  walletAmount: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
  },
  walletStatItem: {
    alignItems: 'center',
  },
  walletStatValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  walletStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});

export default Profil;

