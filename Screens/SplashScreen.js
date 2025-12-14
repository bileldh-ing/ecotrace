import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    Text,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate in
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 1,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Wait 3 seconds then fade out
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                if (onFinish) {
                    onFinish();
                }
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                },
            ]}
        >
            <StatusBar barStyle="light-content" backgroundColor="#0A192F" translucent={false} />
            <LinearGradient
                colors={['#0A192F', '#0F172A', '#0A192F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            transform: [
                                {
                                    translateY: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    {/* Logo + Animation Container */}
                    <View style={styles.centerContainer}>
                        {/* Logo */}
                        <Image
                            source={require('../assets/logo_nexus.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />

                        {/* Lottie Animation - Splashing */}
                        <LottieView
                            source={require('../assets/splashing.json')}
                            autoPlay
                            loop
                            style={styles.lottie}
                        />
                    </View>

                    {/* App Description */}
                    <Text style={styles.appDescription}>
                        Turn waste into value with EcoTrace
                    </Text>

                    {/* Three Words */}
                    <Text style={styles.tagline}>Recycle • Impact • Transform</Text>
                </Animated.View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        flex: 1,
    },
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logo: {
        width: width * 0.45,
        height: width * 0.45,
        marginBottom: -10,
    },
    lottie: {
        width: width * 0.6,
        height: width * 0.6,
    },
    appDescription: {
        fontSize: 13,
        fontWeight: '500',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 8,
        letterSpacing: 0.3,
        lineHeight: 18,
    },
    tagline: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2ECC71',
        letterSpacing: 2,
        textAlign: 'center',
        marginTop: 6,
    },
});

export default SplashScreen;
