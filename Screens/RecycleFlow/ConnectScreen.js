import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { getUserItems, updateItemStatus } from '../../services/ecoService';
import { processItemSale } from '../../services/financialEngine';
import { initializeFactoryChat, createFactoryUser } from '../../services/factoryChat';
import { MOCK_FACTORIES } from '../../constants/MockData';
import Colors from '../../constants/Colors';

const ConnectScreen = ({ navigation }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        loadItems();

        // Refresh listener
        const unsubscribe = navigation.addListener('focus', () => {
            loadItems();
        });

        return unsubscribe;
    }, [navigation]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const userItems = await getUserItems(currentUser.uid);

            // Simulate fetching bids for each item
            const itemsWithBids = await Promise.all(
                userItems.map(async (item) => {
                    // In a real app, we'd fetch actual bids. 
                    // Here we generate mock bids based on item value if status is LISTED
                    let bids = [];
                    if (item.status === 'LISTED' || item.status === 'active') {
                        bids = generateMockBids(item);
                    }
                    return { ...item, bids };
                })
            );

            setItems(itemsWithBids);
        } catch (error) {
            console.error('Error loading items:', error);
            Alert.alert('Error', 'Failed to load your items.');
        } finally {
            setLoading(false);
        }
    };

    const generateMockBids = (item) => {
        // Generate 1-3 random bids from mock factories
        const numBids = Math.floor(Math.random() * 3) + 1;
        const bids = [];
        const factories = Object.values(MOCK_FACTORIES || {});
        const shuffledFactories = factories.sort(() => 0.5 - Math.random());

        const safeEstimatedValue = Number(item?.estimated_value || 0);
        const count = Math.min(numBids, shuffledFactories.length);

        for (let i = 0; i < count; i++) {
            const factory = shuffledFactories[i];
            // Bid is +/- 10% of estimated value
            const variation = (Math.random() * 0.2) - 0.1;
            const amount = safeEstimatedValue * (1 + variation);

            bids.push({
                id: `bid_${item.id}_${i}`,
                factory: factory,
                amount: parseFloat(amount.toFixed(2)),
                message: `We can recycle this ${item.sub_type} immediately.`,
            });
        }

        return bids.sort((a, b) => b.amount - a.amount);
    };

    const handleAcceptBid = async (item, bid) => {
        setProcessingId(item.id);
        try {
            // 1. Process Sale (Financial Engine)
            const result = await processItemSale(
                item.id,
                bid.amount,
                currentUser.uid,
                `Sold ${item.sub_type} to ${bid.factory.name}`
            );

            // 2. Update Item Status
            await updateItemStatus(item.id, 'SOLD');

            // 3. Refresh UI handled by navigation listener or manual reload
            loadItems();

            // Success is handled by processItemSale's toast, but we can add a custom alert if needed
        } catch (error) {
            console.error('Error accepting bid:', error);
            Alert.alert('Error', 'Transaction failed. Please try again.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleContactFactory = async (item, factory) => {
        setProcessingId(item.id); // Show loading indicator
        try {
            // 1. Ensure factory exists as a user
            const factoryUserId = await createFactoryUser(factory);

            // 2. Initialize chat
            const chatId = await initializeFactoryChat(
                currentUser.uid,
                factoryUserId,
                item.id
            );

            // 3. Navigate to Chat
            navigation.navigate('Chat', {
                chatId: chatId,
                recipientId: factoryUserId,
                recipientName: factory.name,
                recipientImage: factory.logo_url,
            });

        } catch (error) {
            console.error('Error starting chat:', error);
            Alert.alert('Error', 'Failed to start chat.');
        } finally {
            setProcessingId(null);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            {/* Item Header */}
            <View style={styles.itemHeader}>
                <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/100' }}
                    style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.sub_type}</Text>
                    <Text style={styles.itemCategory}>{item.category} • {item.condition}</Text>
                    <View style={[styles.statusBadge,
                    item.status === 'SOLD' ? styles.statusSold : styles.statusPending
                    ]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>
                <View style={styles.valueContainer}>
                    <Text style={styles.valueLabel}>Est.</Text>
                    <Text style={styles.valueAmount}>{item.estimated_value} TND</Text>
                </View>
            </View>

            {/* Bids Section */}
            {(item.status === 'LISTED' || item.status === 'active') && item.bids && item.bids.length > 0 && (
                <View style={styles.bidsContainer}>
                    <Text style={styles.bidsTitle}>Offers from Recyclers ({item.bids.length})</Text>
                    {item.bids.map((bid) => (
                        <View key={bid.id} style={styles.bidCard}>
                            <View style={styles.bidHeader}>
                                <Image source={{ uri: bid.factory.logo_url }} style={styles.factoryLogo} />
                                <View style={styles.factoryInfo}>
                                    <Text style={styles.factoryName}>{bid.factory.name}</Text>
                                    <Text style={styles.bidMessage}>{bid.message}</Text>
                                </View>
                                <Text style={styles.bidAmount}>{bid.amount} TND</Text>
                            </View>

                            <View style={styles.bidActions}>
                                <TouchableOpacity
                                    style={styles.chatButton}
                                    onPress={() => handleContactFactory(item, bid.factory)}
                                    disabled={processingId === item.id}
                                >
                                    <Text style={styles.chatButtonText}>💬 Chat</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.acceptButton}
                                    onPress={() => handleAcceptBid(item, bid)}
                                    disabled={processingId === item.id}
                                >
                                    <LinearGradient
                                        colors={[Colors.accent_gradient_start, Colors.accent_gradient_end]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.acceptGradient}
                                    >
                                        {processingId === item.id ? (
                                            <ActivityIndicator color="#FFF" size="small" />
                                        ) : (
                                            <Text style={styles.acceptButtonText}>Accept Deal</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {(item.status === 'LISTED' || item.status === 'active') && (!item.bids || item.bids.length === 0) && (
                <View style={styles.noBidsContainer}>
                    <Text style={styles.noBidsText}>Waiting for offers...</Text>
                    <ActivityIndicator size="small" color={Colors.text_secondary} style={{ marginTop: 8 }} />
                </View>
            )}

            {item.status === 'SCANNED' && (
                <View style={styles.noBidsContainer}>
                    <Text style={styles.noBidsText}>Waiting for admin approval...</Text>
                    <ActivityIndicator size="small" color={Colors.text_secondary} style={{ marginTop: 8 }} />
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background_main} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Recyclables</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterButtonText}>🔽</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.accent_gradient_end} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>♻️</Text>
                            <Text style={styles.emptyText}>No items scanned yet</Text>
                            <TouchableOpacity
                                style={styles.scanButton}
                                onPress={() => navigation.navigate('RecycleFlow')}
                            >
                                <Text style={styles.scanButtonText}>Scan Item</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
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
    filterButton: {
        padding: 8,
    },
    filterButtonText: {
        fontSize: 20,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemCard: {
        backgroundColor: Colors.background_card,
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
    },
    itemHeader: {
        flexDirection: 'row',
        padding: 16,
    },
    itemImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: '#333',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    itemTitle: {
        color: Colors.text_primary,
        fontSize: 16,
        fontWeight: '700',
    },
    itemCategory: {
        color: Colors.text_secondary,
        fontSize: 12,
        marginTop: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 8,
    },
    statusPending: {
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
    },
    statusSold: {
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
    },
    statusText: {
        color: Colors.text_primary,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    valueContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    valueLabel: {
        color: Colors.text_secondary,
        fontSize: 10,
    },
    valueAmount: {
        color: Colors.success,
        fontSize: 16,
        fontWeight: '700',
    },
    bidsContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    bidsTitle: {
        color: Colors.text_secondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    bidCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    bidHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    factoryLogo: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF',
    },
    factoryInfo: {
        flex: 1,
        marginLeft: 12,
    },
    factoryName: {
        color: Colors.text_primary,
        fontSize: 14,
        fontWeight: '600',
    },
    bidMessage: {
        color: Colors.text_secondary,
        fontSize: 11,
        marginTop: 2,
    },
    bidAmount: {
        color: Colors.success,
        fontSize: 16,
        fontWeight: '700',
    },
    bidActions: {
        flexDirection: 'row',
        gap: 12,
    },
    chatButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    chatButtonText: {
        color: Colors.text_primary,
        fontSize: 13,
        fontWeight: '600',
    },
    acceptButton: {
        flex: 2,
        borderRadius: 8,
        overflow: 'hidden',
    },
    acceptGradient: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    noBidsContainer: {
        padding: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    noBidsText: {
        color: Colors.text_secondary,
        fontSize: 13,
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 20,
        opacity: 0.5,
    },
    emptyText: {
        color: Colors.text_secondary,
        fontSize: 16,
        marginBottom: 30,
    },
    scanButton: {
        backgroundColor: Colors.accent_gradient_end,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 20,
    },
    scanButtonText: {
        color: '#FFF',
        fontWeight: '700',
    },
});

export default ConnectScreen;
