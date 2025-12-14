import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    SafeAreaView,
    Dimensions,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { firebaseDatabase } from '../config';
import { ref, onValue } from 'firebase/database';
import { useFocusEffect } from '@react-navigation/native';
import { getUserWallet } from '../services/ecoService';
import ImpactDashboard from '../components/ImpactDashboard';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

const HomeDashboard = ({ navigation }) => {
    const [userWallet, setUserWallet] = useState(null);
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const safeNumber = (val) => {
        const n = Number(val);
        return Number.isFinite(n) ? n : 0;
    };

    useEffect(() => {
        if (currentUser) {
            loadUserData();
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser?.uid) return;

        const ecoUserRef = ref(firebaseDatabase, `eco_users/${currentUser.uid}`);
        const unsubscribe = onValue(ecoUserRef, (snapshot) => {
            if (snapshot.exists()) {
                setUserWallet(snapshot.val());
            }
        });

        return () => {
            unsubscribe();
        };
    }, [currentUser?.uid]);

    useFocusEffect(
        React.useCallback(() => {
            if (currentUser) {
                loadUserData();
            }
        }, [currentUser])
    );

    const loadUserData = async () => {
        try {
            const walletData = await getUserWallet(currentUser.uid);
            setUserWallet(walletData);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background_main} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Impact Stats */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>Welcome Back</Text>
                        <Text style={styles.userName}>{currentUser?.email?.split('@')[0] || 'User'}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.walletButton}
                        onPress={() => navigation.navigate('WalletScreen')}
                    >
                        <LinearGradient
                            colors={[Colors.accent_gradient_start, Colors.accent_gradient_end]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.walletGradient}
                        >
                            <Text style={styles.walletLabel}>Balance</Text>
                            <Text style={styles.walletAmount}>
                                {(userWallet?.wallet_balance || 0).toFixed(2)} {Colors.currency}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Impact Dashboard */}
                <ImpactDashboard
                    trees={safeNumber(userWallet?.trees_planted)}
                    animals={safeNumber(userWallet?.animals_saved)}
                    items={safeNumber(userWallet?.total_recycled_items)}
                />

                {/* Main Action Cards */}
                <View style={styles.cardsContainer}>
                    {/* Electronics Recycling Card */}
                    <TouchableOpacity
                        style={styles.cardWrapper}
                        onPress={() => navigation.navigate('RecycleFlow', { category: 'Electronics' })}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={Colors.border_gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientBorder}
                        >
                            <View style={styles.card}>
                                <Image
                                    source={require('../assets/device.png')}
                                    style={styles.cardImage}
                                    resizeMode="contain"
                                />
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>Electronics</Text>
                                    <Text style={styles.cardSubtitle}>Recycle your old devices</Text>
                                    <View style={styles.cardBadge}>
                                        <Text style={styles.badgeText}>📱 💻 📺</Text>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Plastics Recycling Card */}
                    <TouchableOpacity
                        style={styles.cardWrapper}
                        onPress={() => navigation.navigate('RecycleFlow', { category: 'Plastics' })}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={Colors.border_gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientBorder}
                        >
                            <View style={styles.card}>
                                <Image
                                    source={require('../assets/bottle.png')}
                                    style={styles.cardImage}
                                    resizeMode="contain"
                                />
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>Plastics</Text>
                                    <Text style={styles.cardSubtitle}>Turn plastic into profit</Text>
                                    <View style={styles.cardBadge}>
                                        <Text style={styles.badgeText}>🧴 🥤 🛍️</Text>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Volunteer Card - Full Width with Image Background */}
                    <TouchableOpacity
                        style={styles.volunteerCardWrapper}
                        onPress={() => navigation.navigate('VolunteerEventsFeed')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={Colors.border_gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientBorderFull}
                        >
                            <View style={styles.volunteerCard}>
                                <Image
                                    source={require('../assets/volunteer.png')}
                                    style={styles.volunteerImage}
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                                    style={styles.volunteerOverlay}
                                >
                                    <Text style={styles.volunteerTitle}>VOLUNTEER & ACT</Text>
                                    <Text style={styles.volunteerSubtitle}>
                                        Join community events • Report emergencies • Make an impact
                                    </Text>
                                    <View style={styles.volunteerBadge}>
                                        <Text style={styles.volunteerBadgeText}>Earn $1.00 TND per event</Text>
                                    </View>
                                </LinearGradient>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Quick Access */}
                <View style={styles.quickAccessContainer}>
                    <Text style={styles.quickAccessTitle}>Quick Access</Text>
                    <View style={styles.quickAccessRow}>
                        <TouchableOpacity
                            style={styles.quickAccessButton}
                            onPress={() => navigation.navigate('Marketplace')}
                        >
                            <Text style={styles.quickAccessIcon}>🏪</Text>
                            <Text style={styles.quickAccessLabel}>Marketplace</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.quickAccessIcon}>💚</Text>
                            <Text style={styles.quickAccessLabel}>Campaigns</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessButton}
                            onPress={() => navigation.navigate('AnimalAdoption')}
                        >
                            <Text style={styles.quickAccessIcon}>🐶</Text>
                            <Text style={styles.quickAccessLabel}>Adopt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessButton}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Text style={styles.quickAccessIcon}>👤</Text>
                            <Text style={styles.quickAccessLabel}>Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background_main,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 14,
        color: Colors.text_secondary,
        fontWeight: '500',
    },
    userName: {
        fontSize: 24,
        color: Colors.text_primary,
        fontWeight: '700',
        marginTop: 4,
    },
    walletButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    walletGradient: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'flex-end',
    },
    walletLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    walletAmount: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '700',
        marginTop: 2,
    },
    impactRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: Colors.background_card,
        marginHorizontal: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    impactStat: {
        alignItems: 'center',
    },
    impactValue: {
        fontSize: 28,
        color: Colors.text_primary,
        fontWeight: '700',
    },
    impactLabel: {
        fontSize: 13,
        color: Colors.text_secondary,
        marginTop: 4,
        fontWeight: '500',
    },
    cardsContainer: {
        paddingHorizontal: 20,
    },
    cardWrapper: {
        marginBottom: 16,
    },
    gradientBorder: {
        padding: 2,
        borderRadius: 20,
    },
    card: {
        backgroundColor: Colors.background_card,
        borderRadius: 18,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardImage: {
        width: 80,
        height: 80,
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 24,
        color: Colors.text_primary,
        fontWeight: '700',
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.text_secondary,
        marginTop: 4,
        fontWeight: '500',
    },
    cardBadge: {
        marginTop: 8,
    },
    badgeText: {
        fontSize: 20,
    },
    volunteerCardWrapper: {
        marginTop: 8,
    },
    gradientBorderFull: {
        padding: 2,
        borderRadius: 20,
    },
    volunteerCard: {
        borderRadius: 18,
        height: 180,
        overflow: 'hidden',
        position: 'relative',
    },
    volunteerImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    volunteerOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    volunteerTitle: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '800',
        letterSpacing: 3,
        textAlign: 'center',
    },
    volunteerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 18,
    },
    volunteerBadge: {
        marginTop: 12,
        backgroundColor: Colors.success,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    volunteerBadgeText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    quickAccessContainer: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    quickAccessTitle: {
        fontSize: 18,
        color: Colors.text_primary,
        fontWeight: '700',
        marginBottom: 12,
    },
    quickAccessRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickAccessButton: {
        backgroundColor: Colors.background_card,
        width: (width - 60) / 4,
        aspectRatio: 1,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickAccessIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    quickAccessLabel: {
        fontSize: 11,
        color: Colors.text_secondary,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default HomeDashboard;
