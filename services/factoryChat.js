// Factory Chat Wrapper - Integrate factories with existing Chat.js
import { firebaseDatabase } from '../config';
import { ref, set, get, push } from 'firebase/database';

/**
 * Create or get factory user profile in Firebase
 * This allows factories to appear as chat participants
 * @param {Object} factory - Factory data from eco_factories
 * @returns {Promise<string>} - Factory user ID
 */
export const createFactoryUser = async (factory) => {
    try {
        const factoryUserId = `factory_${factory.id}`;

        // Check if factory user already exists
        const userRef = ref(firebaseDatabase, `users/${factoryUserId}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            console.log('✅ Factory user already exists:', factoryUserId);
            return factoryUserId;
        }

        // Create factory as a user in Firebase
        await set(userRef, {
            uid: factoryUserId,
            email: `${factory.id}@factory.ecosynergy.tn`,
            username: factory.name,
            name: factory.name,
            image: factory.logo_url,
            type: 'factory', // Special flag to identify factories
            factoryData: {
                type: factory.type,
                rating: factory.rating,
                accepts_materials: factory.accepts_materials,
                address: factory.address,
            },
            status: 'online',
            createdAt: Date.now(),
            lastSeen: Date.now(),
        });

        console.log('✅ Factory user created:', factoryUserId);
        return factoryUserId;
    } catch (error) {
        console.error('❌ Error creating factory user:', error);
        throw error;
    }
};

/**
 * Initialize chat between user and factory
 * Uses existing chat infrastructure from ChatApp
 * @param {string} userId - Regular user ID
 * @param {string} factoryUserId - Factory user ID
 * @param {string} itemId - Related item ID
 * @param {string} listingId - Related listing ID (optional)
 * @returns {Promise<string>} - Chat ID
 */
export const initializeFactoryChat = async (userId, factoryUserId, itemId, listingId = null) => {
    try {
        // Create unique chat ID (sorted to ensure same chat regardless of who initiates)
        const participants = [userId, factoryUserId].sort();
        const chatId = participants.join('_');

        const chatRef = ref(firebaseDatabase, `chats/${chatId}`);
        const snapshot = await get(chatRef);

        if (!snapshot.exists()) {
            // Create new chat
            await set(chatRef, {
                participants: participants,
                lastMessage: 'Chat started for recycling deal',
                timestamp: Date.now(),
                metadata: {
                    type: 'recycling_deal',
                    itemId: itemId,
                    listingId: listingId,
                    status: 'active',
                },
            });

            // Send initial automated message
            const messagesRef = ref(firebaseDatabase, `messages/${chatId}`);
            const initialMessageRef = push(messagesRef);

            await set(initialMessageRef, {
                senderId: factoryUserId,
                text: `Hello! I'm interested in your item. Let's discuss the details.`,
                timestamp: Date.now(),
                type: 'text',
                isSystemMessage: true,
            });

            console.log('✅ Factory chat initialized:', chatId);
        } else {
            console.log('✅ Factory chat already exists:', chatId);
        }

        return chatId;
    } catch (error) {
        console.error('❌ Error initializing factory chat:', error);
        throw error;
    }
};

/**
 * Get all factory chats for a user
 * Filters chats to show only those with factories
 * @param {string} userId 
 * @returns {Promise<Array>} - Array of factory chats
 */
export const getUserFactoryChats = async (userId) => {
    try {
        const chatsRef = ref(firebaseDatabase, 'chats');
        const snapshot = await get(chatsRef);

        const factoryChats = [];

        snapshot.forEach((child) => {
            const chat = child.val();
            const chatId = child.key;

            // Check if user is participant and chat has factory metadata
            if (
                chat.participants?.includes(userId) &&
                chat.metadata?.type === 'recycling_deal'
            ) {
                factoryChats.push({
                    chatId,
                    ...chat,
                });
            }
        });

        // Sort by most recent
        factoryChats.sort((a, b) => b.timestamp - a.timestamp);

        return factoryChats;
    } catch (error) {
        console.error('❌ Error getting factory chats:', error);
        return [];
    }
};

/**
 * Add "Recycling Deal" badge metadata to a message
 * @param {string} chatId 
 * @param {string} messageId 
 * @param {Object} dealData - Item/listing data
 */
export const addDealBadgeToChat = async (chatId, dealData) => {
    try {
        const chatRef = ref(firebaseDatabase, `chats/${chatId}/metadata`);
        await set(chatRef, {
            type: 'recycling_deal',
            itemId: dealData.itemId,
            listingId: dealData.listingId,
            itemTitle: dealData.itemTitle,
            estimatedValue: dealData.estimatedValue,
            status: dealData.status || 'negotiating',
            badge: {
                text: '♻️ Recycling Deal',
                color: '#2ECC71',
            },
        });
        console.log('✅ Deal badge added to chat');
    } catch (error) {
        console.error('❌ Error adding deal badge:', error);
    }
};

/**
 * Mark deal as completed in chat metadata
 * @param {string} chatId 
 * @param {number} finalPrice 
 */
export const markDealCompleted = async (chatId, finalPrice) => {
    try {
        const chatRef = ref(firebaseDatabase, `chats/${chatId}/metadata/status`);
        await set(chatRef, 'completed');

        const priceRef = ref(firebaseDatabase, `chats/${chatId}/metadata/finalPrice`);
        await set(priceRef, finalPrice);

        // Send system message
        const messagesRef = ref(firebaseDatabase, `messages/${chatId}`);
        const completionMessageRef = push(messagesRef);

        await set(completionMessageRef, {
            senderId: 'system',
            text: `✅ Deal completed! Final price: ${finalPrice} TND`,
            timestamp: Date.now(),
            type: 'text',
            isSystemMessage: true,
            style: 'success',
        });

        console.log('✅ Deal marked as completed');
    } catch (error) {
        console.error('❌ Error marking deal completed:', error);
    }
};

export default {
    createFactoryUser,
    initializeFactoryChat,
    getUserFactoryChats,
    addDealBadgeToChat,
    markDealCompleted,
};
