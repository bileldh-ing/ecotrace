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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { firebaseAuth, firebaseDatabase } from '../config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';

const Add = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const emailInputRef = useRef(null);
    const phoneInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    const confirmPasswordInputRef = useRef(null);
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

        if (!username.trim()) {
            newErrors.username = 'Username is required';
        } else if (username.trim().length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (phone.trim().length < 8) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle Create Account
    const handleCreateAccount = async () => {
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

            // Create user with Firebase Auth
            console.log('📝 Creating account with email:', email);
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            const user = userCredential.user;
            console.log('✅ Account created successfully with UID:', user.uid);

            // Store user profile in Firebase Realtime Database
            try {
                const userRef = ref(firebaseDatabase, `users/${user.uid}`);
                await set(userRef, {
                    id: user.uid,
                    username: username.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    name: username.trim(),
                    status: 'online',
                    createdAt: Date.now(),
                    lastSeen: Date.now(),
                });

                console.log('✅ User profile created in Realtime DB');

                Alert.alert(
                    'Account Created',
                    'Your account has been created successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                if (navigation) {
                                    navigation.navigate('EcoApp');
                                }
                            },
                        },
                    ]
                );
            } catch (dbError) {
                console.error('⚠️ Error creating user profile in DB:', dbError);
                Alert.alert('Warning', 'Account created but profile setup had an issue.');
                if (navigation) {
                    navigation.navigate('EcoApp');
                }
            }
        } catch (error) {
            console.error('❌ Sign up error:', error.code, error.message);

            let errorMessage = 'Failed to create account';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle Back to Login
    const handleBackToLogin = () => {
        if (navigation) {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
            <ImageBackground
                source={require('../assets/back.jpg')}
                style={[styles.background, { width: screenWidth, height: screenHeight }]}
                blurRadius={2}
            >
                {/* Custom Status Bar View */}
                <View style={styles.customStatusBar} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Lottie Animation */}
                        <View style={styles.animationContainer}>
                            <LottieView
                                source={require('../assets/Robot says hello.json')}
                                autoPlay
                                loop
                                style={styles.lottieAnimation}
                            />
                        </View>

                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join us and start chatting</Text>
                        </View>

                        {/* Glassmorphism Form Container */}
                        <View style={styles.formWrapper}>
                            <LinearGradient
                                colors={['rgba(59, 130, 246, 0.3)', 'rgba(34, 197, 94, 0.2)', 'rgba(139, 92, 246, 0.3)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.gradientBorder}
                            >
                                <View style={styles.formContainer}>
                                    {/* Username Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Username</Text>
                                        <LinearGradient
                                            colors={['rgba(59, 130, 246, 0.2)', 'rgba(34, 197, 94, 0.15)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.inputGradientBorder}
                                        >
                                            <View style={styles.inputBorderWrapper}>
                                                <View style={styles.inputContainer}>
                                                    <Image
                                                        source={require('../assets/profile.png')}
                                                        style={styles.inputIcon}
                                                    />
                                                    <TextInput
                                                        style={[styles.input, errors.username && styles.inputError]}
                                                        placeholder="Choose a username"
                                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                                        value={username}
                                                        onChangeText={(text) => {
                                                            setUsername(text);
                                                            if (errors.username) setErrors({ ...errors, username: '' });
                                                        }}
                                                        editable={!loading}
                                                        returnKeyType="next"
                                                        onSubmitEditing={() => emailInputRef.current?.focus()}
                                                    />
                                                </View>
                                            </View>
                                        </LinearGradient>
                                        {errors.username && (
                                            <Text style={styles.errorText}>{errors.username}</Text>
                                        )}
                                    </View>

                                    {/* Email Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email Address</Text>
                                        <LinearGradient
                                            colors={['rgba(59, 130, 246, 0.2)', 'rgba(34, 197, 94, 0.15)']}
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
                                                        ref={emailInputRef}
                                                        style={[styles.input, errors.email && styles.inputError]}
                                                        placeholder="your@email.com"
                                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                                        keyboardType="email-address"
                                                        autoCapitalize="none"
                                                        value={email}
                                                        onChangeText={(text) => {
                                                            setEmail(text);
                                                            if (errors.email) setErrors({ ...errors, email: '' });
                                                        }}
                                                        editable={!loading}
                                                        returnKeyType="next"
                                                        onSubmitEditing={() => phoneInputRef.current?.focus()}
                                                    />
                                                </View>
                                            </View>
                                        </LinearGradient>
                                        {errors.email && (
                                            <Text style={styles.errorText}>{errors.email}</Text>
                                        )}
                                    </View>

                                    {/* Phone Number Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Phone Number</Text>
                                        <LinearGradient
                                            colors={['rgba(59, 130, 246, 0.2)', 'rgba(34, 197, 94, 0.15)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.inputGradientBorder}
                                        >
                                            <View style={styles.inputBorderWrapper}>
                                                <View style={styles.inputContainer}>
                                                    <Image
                                                        source={require('../assets/phone.png')}
                                                        style={styles.inputIcon}
                                                    />
                                                    <TextInput
                                                        ref={phoneInputRef}
                                                        style={[styles.input, errors.phone && styles.inputError]}
                                                        placeholder="+1 234 567 890"
                                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                                        keyboardType="phone-pad"
                                                        value={phone}
                                                        onChangeText={(text) => {
                                                            setPhone(text);
                                                            if (errors.phone) setErrors({ ...errors, phone: '' });
                                                        }}
                                                        editable={!loading}
                                                        returnKeyType="next"
                                                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                                                    />
                                                </View>
                                            </View>
                                        </LinearGradient>
                                        {errors.phone && (
                                            <Text style={styles.errorText}>{errors.phone}</Text>
                                        )}
                                    </View>

                                    {/* Password Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Password</Text>
                                        <LinearGradient
                                            colors={['rgba(59, 130, 246, 0.2)', 'rgba(34, 197, 94, 0.15)']}
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
                                                        placeholder="At least 6 characters"
                                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                                        secureTextEntry={!showPassword}
                                                        value={password}
                                                        onChangeText={(text) => {
                                                            setPassword(text);
                                                            if (errors.password) setErrors({ ...errors, password: '' });
                                                        }}
                                                        editable={!loading}
                                                        returnKeyType="next"
                                                        onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
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

                                    {/* Confirm Password Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Confirm Password</Text>
                                        <LinearGradient
                                            colors={['rgba(59, 130, 246, 0.2)', 'rgba(34, 197, 94, 0.15)']}
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
                                                        ref={confirmPasswordInputRef}
                                                        style={[styles.input, errors.confirmPassword && styles.inputError]}
                                                        placeholder="Re-enter your password"
                                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                                        secureTextEntry={!showConfirmPassword}
                                                        value={confirmPassword}
                                                        onChangeText={(text) => {
                                                            setConfirmPassword(text);
                                                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                                        }}
                                                        editable={!loading}
                                                        returnKeyType="done"
                                                        onSubmitEditing={() => {
                                                            if (!loading) {
                                                                handleCreateAccount();
                                                            }
                                                        }}
                                                    />
                                                    <TouchableOpacity
                                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        style={styles.passwordToggleIcon}
                                                        disabled={loading}
                                                    >
                                                        <Image
                                                            source={
                                                                showConfirmPassword
                                                                    ? require('../assets/see.png')
                                                                    : require('../assets/hide.png')
                                                            }
                                                            style={styles.inputIcon}
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                        {errors.confirmPassword && (
                                            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                                        )}
                                    </View>

                                    {/* Create Account Button */}
                                    <TouchableOpacity
                                        style={styles.buttonWrapper}
                                        onPress={handleCreateAccount}
                                        disabled={loading}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={[
                                                'rgba(34, 197, 94, 0.9)',
                                                'rgba(59, 130, 246, 0.9)',
                                                'rgba(139, 92, 246, 0.9)',
                                            ]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.createButton}
                                        >
                                            <LinearGradient
                                                colors={['rgba(30, 30, 30, 0.95)', 'rgba(20, 20, 20, 0.95)']}
                                                style={styles.createButtonInner}
                                            >
                                                {loading ? (
                                                    <ActivityIndicator size="large" color="#22C55E" />
                                                ) : (
                                                    <View style={styles.createContent}>
                                                        <Text style={styles.createText}>Create Account</Text>
                                                    </View>
                                                )}
                                            </LinearGradient>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Back to Login Section */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity
                                onPress={handleBackToLogin}
                                disabled={loading}
                            >
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom Safe Area */}
                <View style={styles.bottomSafeArea} />
            </ImageBackground>
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
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    animationContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    lottieAnimation: {
        width: 150,
        height: 150,
    },
    headerContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
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
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
    },
    gradientBorder: {
        padding: 2,
        borderRadius: 24,
    },
    formContainer: {
        backgroundColor: 'rgba(10, 10, 20, 0.75)',
        borderRadius: 22,
        padding: 24,
        backdropFilter: 'blur(100px)',
        borderWidth: 1.5,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        shadowColor: 'rgba(59, 130, 246, 0.5)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 8,
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
        fontSize: 15,
        color: '#FFFFFF',
        padding: 12,
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
    buttonWrapper: {
        marginTop: 8,
        borderRadius: 14,
        overflow: 'hidden',
    },
    createButton: {
        padding: 2,
        borderRadius: 14,
    },
    createButtonInner: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    createContent: {
        zIndex: 2,
    },
    createText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    loginText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 16,
        fontWeight: '500',
    },
    loginLink: {
        color: '#3B82F6',
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
    bottomSafeArea: {
        height: 20,
        backgroundColor: 'transparent',
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
});

export default Add;
