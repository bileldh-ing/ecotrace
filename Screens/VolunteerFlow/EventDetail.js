import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { joinEvent, updateWalletBalance } from '../../services/ecoService';
import Colors from '../../constants/Colors';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

const EventDetail = ({ navigation, route }) => {
    const { event } = route.params;
    const [joining, setJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    const handleParticipate = async () => {
        if (!currentUser) {
            Alert.alert('Error', 'Please log in first');
            return;
        }

        setJoining(true);
        try {
            // Add reward to wallet (default 5 TND per directive)
            const reward = event.reward || 5.0;
            await updateWalletBalance(currentUser.uid, reward);

            // Mark as participated
            setHasJoined(true);

            Alert.alert(
                'Success! 🎉',
                `Thank you for volunteering!\n\nYou earned +${reward.toFixed(1)} ${Colors.currency}`,
                [
                    {
                        text: 'View Profile',
                        onPress: () => navigation.navigate('Profile'),
                    },
                    {
                        text: 'Done',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            console.error('Error participating in event:', error);
            Alert.alert('Error', 'Failed to register participation. Please try again.');
        } finally {
            setJoining(false);
        }
    };

    const isEmergency = event.is_emergency;

    // Handle both local assets and URL images
    const getImageSource = () => {
        if (typeof event.image_url === 'string') {
            return { uri: event.image_url };
        } else if (event.image_url) {
            return event.image_url; // Local require()
        }
        return { uri: 'https://via.placeholder.com/400' };
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={getImageSource()}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(10, 25, 47, 1)']}
                        style={styles.gradientOverlay}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Image
                                source={require('../../assets/left-arrow.png')}
                                style={styles.backIcon}
                            />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>


                <View style={styles.contentContainer}>
                    {/* Header Info */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 500 }}
                    >
                        {isEmergency && (
                            <View style={[styles.badge, styles.emergencyBadge]}>
                                <Text style={styles.badgeText}>🚨 SEVERITY LEVEL: {event.severity_level}</Text>
                            </View>
                        )}

                        <Text style={styles.title}>{event.title}</Text>

                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaIcon}>📅</Text>
                                <Text style={styles.metaText}>
                                    {new Date(event.date).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaIcon}>📍</Text>
                                <Text style={styles.metaText}>
                                    {event.location_name || 'Coordinates Tagged'}
                                </Text>
                            </View>
                        </View>
                    </MotiView>

                    {/* Stats Row */}
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 500, delay: 200 }}
                        style={styles.statsContainer}
                    >
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{event.participants_count || 0}</Text>
                            <Text style={styles.statLabel}>Going</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{event.required_participants || 10}</Text>
                            <Text style={styles.statLabel}>Needed</Text>
                        </View>
                        {!isEmergency && (
                            <>
                                <View style={styles.verticalDivider} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: Colors.success }]}>
                                        +{event.reward_amount}
                                    </Text>
                                    <Text style={styles.statLabel}>Reward</Text>
                                </View>
                            </>
                        )}
                    </MotiView>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.description}>
                            {event.description || 'No details provided.'}
                        </Text>
                    </View>

                    {/* Map Placeholder */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Location</Text>
                        <View style={styles.mapPlaceholder}>
                            <Text style={styles.mapText}>🗺️ Map View Loading...</Text>
                            <Text style={styles.coordsText}>
                                {event.latitude?.toFixed(4)}, {event.longitude?.toFixed(4)}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Action Bar */}
            <View style={styles.actionBar}>
                {/* Reward Display */}
                <View style={styles.rewardContainer}>
                    <Text style={styles.rewardLabel}>Earn:</Text>
                    <LinearGradient
                        colors={Colors.accent_gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.rewardPill}
                    >
                        <Text style={styles.rewardText}>
                            +{(event.reward || 5.0).toFixed(1)} {Colors.currency}
                        </Text>
                    </LinearGradient>
                </View>

                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        hasJoined && styles.joinedButton,
                        isEmergency && styles.emergencyButton
                    ]}
                    onPress={handleParticipate}
                    disabled={hasJoined || joining}
                >
                    <LinearGradient
                        colors={
                            hasJoined ? ['#555', '#444'] :
                                isEmergency ? [Colors.alert_high, '#C0392B'] :
                                    [Colors.accent_gradient_start, Colors.accent_gradient_end]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionGradient}
                    >
                        {joining ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.actionButtonText}>
                                {hasJoined ? 'YOU ARE GOING ✅' : isEmergency ? 'RESPOND TO EMERGENCY 🚑' : 'PARTICIPATE 🌿'}
                            </Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background_main,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    imageContainer: {
        height: 350,
        width: '100%',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 50,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 24,
        marginTop: -2,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#FFFFFF',
    },
    contentContainer: {
        marginTop: -40,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: Colors.background_main,
        padding: 24,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 16,
    },
    emergencyBadge: {
        backgroundColor: Colors.alert_high,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text_primary,
        marginBottom: 16,
        lineHeight: 34,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 24,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    metaText: {
        color: Colors.text_secondary,
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.background_card,
        borderRadius: 16,
        padding: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text_primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.text_secondary,
    },
    verticalDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text_primary,
        marginBottom: 12,
    },
    description: {
        color: Colors.text_secondary,
        fontSize: 16,
        lineHeight: 24,
    },
    mapPlaceholder: {
        height: 150,
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(52, 152, 219, 0.3)',
    },
    mapText: {
        color: '#3498DB',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    coordsText: {
        color: Colors.text_secondary,
        fontSize: 12,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.background_main,
        padding: 20,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    actionButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    actionGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

export default EventDetail;
