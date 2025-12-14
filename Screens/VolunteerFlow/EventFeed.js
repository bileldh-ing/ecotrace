import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { getEvents } from '../../services/ecoService';
import Colors from '../../constants/Colors';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

const EventFeed = ({ navigation }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, EMERGENCY, UPCOMING
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadEvents();
    }, [filter]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const filters = {};

            if (filter === 'EMERGENCY') filters.emergency = true;
            if (filter === 'UPCOMING') filters.status = 'UPCOMING';

            const data = await getEvents(filters);
            setEvents(data);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadEvents();
    };

    const renderEventCard = ({ item, index }) => {
        const isEmergency = item.is_emergency;

        // Calculate dynamic height for masonry effect (mock)
        const height = isEmergency ? 260 : 220;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('EventDetail', { event: item })}
                style={[styles.cardContainer, { height }]}
            >
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 500, delay: index * 100 }}
                    style={styles.cardInner}
                >
                    {/* Card Image */}
                    <Image
                        source={{ uri: item.image_url || 'https://via.placeholder.com/300' }}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />

                    {/* Overlay Gradient */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.gradientOverlay}
                    >
                        {/* Severity Badge (for emergencies) */}
                        {isEmergency && (
                            <MotiView
                                from={{ opacity: 0.6, scale: 1 }}
                                animate={{ opacity: 1, scale: 1.05 }}
                                transition={{
                                    type: 'timing',
                                    duration: 800,
                                    loop: true,
                                    repeatReverse: true,
                                }}
                                style={[
                                    styles.severityBadge,
                                    { backgroundColor: item.severity_level >= 8 ? Colors.alert_high : Colors.alert_medium }
                                ]}
                            >
                                <Text style={styles.severityText}>
                                    {item.severity_level === 10 ? '🔥 CRITICAL' : '⚠️ URGENT'}
                                </Text>
                            </MotiView>
                        )}

                        <View style={styles.cardContent}>
                            <Text style={styles.eventTitle} numberOfLines={2}>
                                {item.title}
                            </Text>

                            <View style={styles.eventMeta}>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaIcon}>👥</Text>
                                    <Text style={styles.metaText}>{item.participants_count || 0}</Text>
                                </View>
                                {!isEmergency && (
                                    <View style={styles.rewardBadge}>
                                        <Text style={styles.rewardText}>+{item.reward_amount} TND</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </MotiView>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background_main} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Eco Community</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {['ALL', 'EMERGENCY', 'UPCOMING'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.activeFilterTab]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                            {f === 'EMERGENCY' ? '🚨 NATURE 911' : f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Event List */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.accent_gradient_end} />
                </View>
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderEventCard}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}

            {/* FAB - Report Emergency */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ReportEmergency')}
            >
                <LinearGradient
                    colors={[Colors.alert_high, '#C0392B']}
                    style={styles.fabGradient}
                >
                    <Text style={styles.fabIcon}>🚨</Text>
                    <Text style={styles.fabText}>REPORT</Text>
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background_main,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.background_card,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 24,
        color: Colors.text_primary,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text_primary,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    activeFilterTab: {
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        borderColor: Colors.success,
    },
    filterText: {
        color: Colors.text_secondary,
        fontSize: 12,
        fontWeight: '600',
    },
    activeFilterText: {
        color: Colors.success,
    },
    listContent: {
        padding: 10,
        paddingBottom: 80, // Space for FAB
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    cardContainer: {
        width: (width - 30) / 2, // 2 columns with spacing
        marginBottom: 10,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardInner: {
        flex: 1,
        backgroundColor: Colors.background_card,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
        justifyContent: 'flex-end',
        padding: 12,
    },
    cardContent: {
        marginTop: 'auto',
    },
    eventTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    eventMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    metaText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    rewardBadge: {
        backgroundColor: Colors.success,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    rewardText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    severityBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 10,
    },
    severityText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 30,
    },
    fabIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    fabText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

export default EventFeed;
