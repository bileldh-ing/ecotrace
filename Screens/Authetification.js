import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { firebaseAuth, firebaseDatabase } from '../config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { ref, push, set } from 'firebase/database';
import { initializeEcoUser } from '../services/ecoService';
import Colors from '../constants/Colors';

const Authentication = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const passwordInputRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Email validation
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Sign In
  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (!firebaseAuth) {
        console.error('❌ Auth object is null or undefined');
        Alert.alert('Error', 'Authentication system not ready. Please try again.');
        setLoading(false);
        return;
      }

      // Try to sign in with existing account
      console.log('🔐 Attempting to sign in with email:', email);
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('✅ Sign in successful');

      // Initialize eco user if not exists (safe to call multiple times)
      try {
        await initializeEcoUser(userCredential.user.uid, email);
        console.log('✅ Eco user initialized');
      } catch (error) {
        console.log('ℹ️ Eco user may already exist:', error.message);
      }

      Alert.alert('Success', 'Welcome to EcoSynergy Nexus!');
      setLoading(false);
      // Navigate to eco-platform main app
      if (navigation) {
        navigation.navigate('EcoApp');
      }
    } catch (error) {
      console.log('⚠️ Sign in error:', error.code, error.message);
      // If sign in fails, try to create new account
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        // Attempt to create a new account
        try {
          console.log('📝 Attempting to create new account with email:', email);
          const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          console.log('✅ Account created successfully');

          // Create user profile in Realtime Database with auto-generated key
          try {
            const profilesRef = ref(firebaseDatabase, 'profiles');
            const newProfileRef = push(profilesRef);
            const profileKey = newProfileRef.key;

            await set(newProfileRef, {
              email: email,
              uid: firebaseAuth.currentUser.uid,
              createdAt: Date.now(),
            });

            console.log('✅ User profile created in Realtime DB with key:', profileKey);

            // Initialize ECO user profile
            await initializeEcoUser(userCredential.user.uid, email);
            console.log('✅ Eco user profile initialized');

            Alert.alert(
              'Account Created',
              'Welcome to EcoSynergy Nexus! Your eco-wallet has been initialized.'
            );
          } catch (dbError) {
            console.error('⚠️ Error creating user profile in DB:', dbError);
            // Still continue even if DB write fails
          }

          setLoading(false);
          // Navigate to add profile screen
          if (navigation) {
            navigation.navigate('Add');
          }
        } catch (signUpError) {
          console.error('❌ Sign up error:', signUpError.code, signUpError.message);
          Alert.alert('Error', signUpError.message);
          setLoading(false);
        }
      } else {
        console.error('❌ Authentication error:', error.code, error.message);
        Alert.alert('Error', error.message);
        setLoading(false);
      }
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(resetEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, resetEmail);
      setShowForgotModal(false);
      setResetEmail('');
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for instructions to reset your password.'
      );
    } catch (error) {
      console.error('Reset password error:', error);
      let message = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      }
      Alert.alert('Error', message);
    } finally {
      setResetLoading(false);
    }
  };

  // Handle Create Account
  const handleCreateAccount = () => {
    // Navigate to add profile screen
    if (navigation) {
      navigation.navigate('Add');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <ImageBackground
        source={require('../assets/back.jpg')}
        style={[styles.background, { width: screenWidth, height: screenHeight }]}
        blurRadius={0}
      >
        {/* No Overlay - Background visible */}
        <View style={styles.blurOverlay} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerContainer}>
              {/* Logo */}
              <Image
                source={require('../assets/logo_dark.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Authentication</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Glassmorphism Form Container */}
            <View style={styles.formWrapper}>
              <LinearGradient
                colors={['#2ECC71', 'rgba(46, 204, 113, 0.7)', '#2ECC71']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBorder}
              >
                {/* Blur Background Effect */}
                <View style={styles.blurBackdrop} />
                <View style={styles.formContainer}>
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <LinearGradient
                      colors={['rgba(46, 204, 113, 0.22)', 'rgba(46, 204, 113, 0.10)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.inputGradientBorder}
                    >
                      <View style={styles.inputBorderWrapper}>
                        <View style={styles.inputContainer}>
                          <Image
                            source={require('../assets/email.png')}
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="your@email.com"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={(text) => {
                              setEmail(text);
                              if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            editable={!loading}
                            returnKeyType="next"
                            onSubmitEditing={() => {
                              passwordInputRef.current?.focus();
                            }}
                          />
                        </View>
                      </View>
                    </LinearGradient>
                    {errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <LinearGradient
                      colors={['rgba(46, 204, 113, 0.22)', 'rgba(46, 204, 113, 0.10)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.inputGradientBorder}
                    >
                      <View style={styles.inputBorderWrapper}>
                        <View style={styles.inputContainer}>
                          <Image
                            source={require('../assets/lock.png')}
                            style={styles.inputIcon}
                          />
                          <TextInput
                            ref={passwordInputRef}
                            style={[styles.input, errors.password && styles.inputError]}
                            placeholder="Enter your password"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={(text) => {
                              setPassword(text);
                              if (errors.password) setErrors({ ...errors, password: '' });
                            }}
                            editable={!loading}
                            returnKeyType="done"
                            onSubmitEditing={() => {
                              if (!loading) {
                                handleSignIn();
                              }
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.passwordToggleIcon}
                            disabled={loading}
                          >
                            <Image
                              source={
                                showPassword
                                  ? require('../assets/see.png')
                                  : require('../assets/hide.png')
                              }
                              style={styles.inputIcon}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </LinearGradient>
                    {errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity
                    style={styles.forgotPasswordContainer}
                    onPress={() => setShowForgotModal(true)}
                    disabled={loading}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  {/* Sign In Button with Gradient Border */}
                  <TouchableOpacity
                    style={styles.buttonWrapper}
                    onPress={handleSignIn}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[
                        'rgba(59, 130, 246, 0.9)',
                        'rgba(34, 197, 94, 0.9)',
                        'rgba(139, 92, 246, 0.9)',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.signInButton}
                    >
                      <LinearGradient
                        colors={['rgba(30, 30, 30, 0.95)', 'rgba(20, 20, 20, 0.95)']}
                        style={styles.signInButtonInner}
                      >
                        {loading ? (
                          <ActivityIndicator size="large" color="#7A69F9" />
                        ) : (
                          <>
                            <View style={styles.signInContent}>
                              <Text style={styles.signInText}>Sign In</Text>
                            </View>

                            {/* Animated Gradient Background */}
                            <View style={styles.animatedGlowContainer}>
                              <LinearGradient
                                colors={[
                                  'rgba(59, 130, 246, 0.4)',
                                  'rgba(34, 197, 94, 0.4)',
                                  'rgba(139, 92, 246, 0.4)',
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.glowEffect}
                              />
                            </View>
                          </>
                        )}
                      </LinearGradient>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.divider} />
                  </View>

                  {/* Social Login Options */}
                  <View style={styles.socialContainer}>
                    <TouchableOpacity
                      style={styles.socialButton}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={['rgba(59, 130, 246, 0.15)', 'rgba(34, 197, 94, 0.1)']}
                        style={styles.socialButtonGradient}
                      >
                        <Image
                          source={require('../assets/google.png')}
                          style={styles.socialIcon}
                        />
                        <Text style={styles.socialButtonText}>Google</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.socialButton}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={['rgba(59, 130, 246, 0.15)', 'rgba(34, 197, 94, 0.1)']}
                        style={styles.socialButtonGradient}
                      >
                        <Image
                          source={require('../assets/facebook.png')}
                          style={styles.socialIcon}
                        />
                        <Text style={styles.socialButtonText}>Facebook</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Create Account Section */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={handleCreateAccount}
                disabled={loading}
              >
                <Text style={styles.signupLink}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.forgotModalContent}>
            <Text style={styles.forgotModalTitle}>Reset Password</Text>
            <Text style={styles.forgotModalDesc}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            <TextInput
              style={styles.resetEmailInput}
              placeholder="Enter your email"
              placeholderTextColor="rgba(148, 163, 184, 0.6)"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!resetLoading}
            />
            <View style={styles.forgotModalButtons}>
              <TouchableOpacity
                style={styles.cancelResetButton}
                onPress={() => {
                  setShowForgotModal(false);
                  setResetEmail('');
                }}
                disabled={resetLoading}
              >
                <Text style={styles.cancelResetText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendResetButton}
                onPress={handleForgotPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendResetText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formWrapper: {
    marginBottom: 30,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: 'rgba(59, 130, 246, 0.8)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 25,
  },
  gradientBorder: {
    padding: 2,
    borderRadius: 28,
    position: 'relative',
  },
  blurBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    backdropFilter: 'none',
    borderRadius: 26,
  },
  formContainer: {
    backgroundColor: 'rgba(10, 10, 20, 0.7)',
    borderRadius: 26,
    padding: 32,
    backdropFilter: 'blur(40px)',
    // Strong glassmorphism effect with dark blue + green border
    borderWidth: 1.5,
    borderColor: 'rgba(46, 204, 113, 0.75)',
    shadowColor: 'rgba(46, 204, 113, 0.7)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 25,
    zIndex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGradientBorder: {
    padding: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputBorderWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    padding: 14,
    paddingLeft: 0,
    fontWeight: '500',
    flex: 1,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonWrapper: {
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  signInButton: {
    padding: 2,
    borderRadius: 14,
  },
  signInButtonInner: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  signInContent: {
    zIndex: 2,
  },
  signInText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  animatedGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    opacity: 0.3,
  },
  glowEffect: {
    flex: 1,
    borderRadius: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  socialButtonGradient: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    gap: 8,
  },
  socialButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  socialIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: 'rgba(255, 255, 255, 0.7)',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  signupLink: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  customStatusBar: {
    height: 35,
    backgroundColor: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: 'rgba(255, 255, 255, 0.6)',
    marginRight: 10,
  },
  passwordToggleIcon: {
    padding: 8,
    marginLeft: 'auto',
  },
  // Forgot Password Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  forgotModalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  forgotModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
    textAlign: 'center',
  },
  forgotModalDesc: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  resetEmailInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#E2E8F0',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    marginBottom: 20,
  },
  forgotModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelResetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    alignItems: 'center',
  },
  cancelResetText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  sendResetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  sendResetText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});

export default Authentication;
