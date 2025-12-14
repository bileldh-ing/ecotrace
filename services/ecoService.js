// EcoSynergy Service - Firebase Realtime Database operations
import { firebaseDatabase } from '../config';
import { ref, set, get, update, push, query, orderByChild, equalTo, remove } from 'firebase/database';

// ============================================
// USER & WALLET OPERATIONS
// ============================================

/**
 * Initialize eco user profile on signup
 */
export const initializeEcoUser = async (firebaseUid, email, city = '', address = '') => {
    try {
        const ecoUserRef = ref(firebaseDatabase, `eco_users/${firebaseUid}`);
        await set(ecoUserRef, {
            firebase_uid: firebaseUid,
            email,
            city,
            address,
            wallet_balance: 0.00,
            total_donated: 0.00,
            trees_planted: 0,
            animals_saved: 0,
            co2_offset_kg: 0,
            responsibility_score: 0,
            total_recycled_items: 0,
            sale_user_share: 0.70,
            created_at: Date.now(),
        });
        console.log('✅ Eco user initialized:', firebaseUid);
        return true;
    } catch (error) {
        console.error('❌ Error initializing eco user:', error);
        throw error;
    }
};

/**
 * Get user's eco wallet data
 */
export const getUserWallet = async (firebaseUid) => {
    try {
        const ecoUserRef = ref(firebaseDatabase, `eco_users/${firebaseUid}`);
        const snapshot = await get(ecoUserRef);

        if (!snapshot.exists()) {
            // Auto-initialize if not exists
            await initializeEcoUser(firebaseUid, 'user@example.com');
            return await getUserWallet(firebaseUid);
        }

        return snapshot.val();
    } catch (error) {
        console.error('❌ Error getting user wallet:', error);
        throw error;
    }
};

/**
 * Update wallet balance
 */
export const updateWalletBalance = async (firebaseUid, amount) => {
    try {
        const ecoUserRef = ref(firebaseDatabase, `eco_users/${firebaseUid}`);
        const snapshot = await get(ecoUserRef);
        const userData = snapshot.val() || {};

        const newBalance = (userData.wallet_balance || 0) + amount;

        await update(ecoUserRef, {
            wallet_balance: parseFloat(newBalance.toFixed(2)),
            updated_at: Date.now(),
        });

        console.log(`✅ Wallet updated: ${amount >= 0 ? '+' : ''}${amount} TND`);
        return newBalance;
    } catch (error) {
        console.error('❌ Error updating wallet:', error);
        throw error;
    }
};

/**
 * Update impact stats (trees, animals, CO2)
 */
export const updateImpactStats = async (firebaseUid, metrics) => {
    try {
        const ecoUserRef = ref(firebaseDatabase, `eco_users/${firebaseUid}`);
        const snapshot = await get(ecoUserRef);
        const userData = snapshot.val() || {};

        const updates = {};

        if (metrics.trees) {
            updates.trees_planted = (userData.trees_planted || 0) + metrics.trees;
        }
        if (metrics.animals) {
            updates.animals_saved = (userData.animals_saved || 0) + metrics.animals;
        }
        if (metrics.co2) {
            updates.co2_offset_kg = (userData.co2_offset_kg || 0) + metrics.co2;
        }

        if (metrics.donated) {
            updates.total_donated = parseFloat(((userData.total_donated || 0) + metrics.donated).toFixed(2));
        }

        if (metrics.recycled) {
            updates.total_recycled_items = (userData.total_recycled_items || 0) + 1;
        }

        updates.updated_at = Date.now();

        await update(ecoUserRef, updates);
        console.log('✅ Impact stats updated:', metrics);
        return true;
    } catch (error) {
        console.error('❌ Error updating impact stats:', error);
        throw error;
    }
};

/**
 * Update multiple user wallet fields
 * @param {string} firebaseUid - Firebase UID
 * @param {object} updates - Object with fields to update (wallet_balance, animals_saved, total_donated, etc)
 */
export const updateUserWallet = async (firebaseUid, updates) => {
    try {
        const ecoUserRef = ref(firebaseDatabase, `eco_users/${firebaseUid}`);
        const snapshot = await get(ecoUserRef);
        const userData = snapshot.val() || {};

        const finalUpdates = {};

        // Handle each possible update field
        if (updates.wallet_balance !== undefined) {
            finalUpdates.wallet_balance = parseFloat(updates.wallet_balance.toFixed(2));
        }
        if (updates.total_donated !== undefined) {
            finalUpdates.total_donated = parseFloat(updates.total_donated.toFixed(2));
        }
        if (updates.animals_saved !== undefined) {
            finalUpdates.animals_saved = updates.animals_saved;
        }
        if (updates.trees_planted !== undefined) {
            finalUpdates.trees_planted = updates.trees_planted;
        }
        if (updates.co2_offset_kg !== undefined) {
            finalUpdates.co2_offset_kg = parseFloat(updates.co2_offset_kg.toFixed(1));
        }
        if (updates.total_recycled_items !== undefined) {
            finalUpdates.total_recycled_items = updates.total_recycled_items;
        }

        if (updates.sale_user_share !== undefined) {
            const raw = Number(updates.sale_user_share);
            const bounded = Math.min(1, Math.max(0, Number.isFinite(raw) ? raw : (userData.sale_user_share ?? 0.70)));
            finalUpdates.sale_user_share = parseFloat(bounded.toFixed(2));
        }

        finalUpdates.updated_at = Date.now();

        await update(ecoUserRef, finalUpdates);
        console.log('✅ User wallet updated:', finalUpdates);
        return finalUpdates;
    } catch (error) {
        console.error('❌ Error updating user wallet:', error);
        throw error;
    }
};

// ============================================
// MARKETPLACE & ITEMS OPERATIONS
// ============================================

/**
 * Create new recyclable item listing
 */
export const createItem = async (firebaseUid, itemData) => {
    try {
        const itemsRef = ref(firebaseDatabase, 'eco_marketplace');
        const newItemRef = push(itemsRef);

        const item = {
            ...itemData,
            seller_id: firebaseUid,
            created_at: Date.now(),
            status: 'active',
            views: 0,
        };

        await set(newItemRef, item);
        console.log('✅ Item created:', newItemRef.key);
        return newItemRef.key;
    } catch (error) {
        console.error('❌ Error creating item:', error);
        throw error;
    }
};

/**
 * Create a scanned item from recycling flow
 * (Alias for createItem but with image URL support)
 */
export const createScannedItem = async (firebaseUid, itemData, imageUrl) => {
    try {
        const itemsRef = ref(firebaseDatabase, 'eco_marketplace');
        const newItemRef = push(itemsRef);

        const item = {
            seller_id: firebaseUid,
            category: itemData.category,
            sub_type: itemData.subType,
            condition: itemData.condition,
            estimated_value: itemData.estimatedValue,
            confidence: itemData.confidence,
            description: itemData.description,
            image_url: imageUrl,
            status: 'SCANNED',
            created_at: Date.now(),
            views: 0,
        };

        await set(newItemRef, item);
        console.log('✅ Scanned item created:', newItemRef.key);
        return newItemRef.key;
    } catch (error) {
        console.error('❌ Error creating scanned item:', error);
        throw error;
    }
};

/**
 * Get all marketplace items
 */
export const getItems = async () => {
    try {
        const itemsRef = ref(firebaseDatabase, 'eco_marketplace');
        const snapshot = await get(itemsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const items = [];
        snapshot.forEach((child) => {
            items.push({
                id: child.key,
                ...child.val(),
            });
        });

        return items;
    } catch (error) {
        console.error('❌ Error getting items:', error);
        throw error;
    }
};

export const getItemById = async (itemId) => {
    try {
        if (!itemId) return null;
        const itemRef = ref(firebaseDatabase, `eco_marketplace/${itemId}`);
        const snapshot = await get(itemRef);
        if (!snapshot.exists()) return null;
        return {
            id: itemId,
            ...snapshot.val(),
        };
    } catch (error) {
        console.error('❌ Error getting item by id:', error);
        throw error;
    }
};

/**
 * Get user items
 */
export const getUserItems = async (firebaseUid) => {
    try {
        const itemsRef = ref(firebaseDatabase, 'eco_marketplace');
        const userItemsQuery = query(itemsRef, orderByChild('seller_id'), equalTo(firebaseUid));
        const snapshot = await get(userItemsQuery);

        if (!snapshot.exists()) {
            return [];
        }

        const items = [];
        snapshot.forEach((child) => {
            items.push({
                id: child.key,
                ...child.val(),
            });
        });

        return items;
    } catch (error) {
        console.error('❌ Error getting user items:', error);
        throw error;
    }
};

/**
 * Update item status (active, sold, removed)
 */
export const updateItemStatus = async (itemId, status) => {
    try {
        const itemRef = ref(firebaseDatabase, `eco_marketplace/${itemId}`);
        await update(itemRef, {
            status,
            updated_at: Date.now(),
        });

        console.log('✅ Item status updated:', status);
        return true;
    } catch (error) {
        console.error('❌ Error updating item status:', error);
        throw error;
    }
};

/**
 * Delete marketplace item
 */
export const deleteItem = async (itemId) => {
    try {
        const itemRef = ref(firebaseDatabase, `eco_marketplace/${itemId}`);
        await remove(itemRef);
        console.log('✅ Item deleted:', itemId);
        return true;
    } catch (error) {
        console.error('❌ Error deleting item:', error);
        throw error;
    }
};

// ============================================
// TRANSACTIONS & PAYMENTS
// ============================================

/**
 * Create transaction record
 */
export const createTransaction = async (firebaseUid, txData) => {
    try {
        const txRef = ref(firebaseDatabase, `eco_transactions/${firebaseUid}`);
        const newTxRef = push(txRef);

        const transaction = {
            ...txData,
            created_at: Date.now(),
            status: 'completed',
        };

        await set(newTxRef, transaction);
        console.log('✅ Transaction recorded:', newTxRef.key);
        return newTxRef.key;
    } catch (error) {
        console.error('❌ Error creating transaction:', error);
        throw error;
    }
};

/**
 * Get user transactions
 */
export const getTransactions = async (firebaseUid) => {
    try {
        const txRef = ref(firebaseDatabase, `eco_transactions/${firebaseUid}`);
        const snapshot = await get(txRef);

        if (!snapshot.exists()) {
            return [];
        }

        const transactions = [];
        snapshot.forEach((child) => {
            transactions.push({
                id: child.key,
                ...child.val(),
            });
        });

        return transactions.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
        console.error('❌ Error getting transactions:', error);
        throw error;
    }
};

// ============================================
// CAMPAIGNS & FUNDRAISING
// ============================================

/**
 * Create fundraising campaign
 */
export const createCampaign = async (campaignData) => {
    try {
        const campaignsRef = ref(firebaseDatabase, 'eco_campaigns');
        const newCampaignRef = push(campaignsRef);

        const campaign = {
            ...campaignData,
            created_at: Date.now(),
            status: 'ACTIVE',
            current_amount: 0,
            donor_count: 0,
        };

        await set(newCampaignRef, campaign);
        console.log('✅ Campaign created:', newCampaignRef.key);
        return newCampaignRef.key;
    } catch (error) {
        console.error('❌ Error creating campaign:', error);
        throw error;
    }
};

export const updateCampaign = async (campaignId, updates) => {
    try {
        const campaignRef = ref(firebaseDatabase, `eco_campaigns/${campaignId}`);
        await update(campaignRef, {
            ...updates,
            updated_at: Date.now(),
        });
        return true;
    } catch (error) {
        console.error('❌ Error updating campaign:', error);
        throw error;
    }
};

/**
 * Get all campaigns
 */
export const getCampaigns = async () => {
    try {
        const campaignsRef = ref(firebaseDatabase, 'eco_campaigns');
        const snapshot = await get(campaignsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const campaigns = [];
        snapshot.forEach((child) => {
            const data = child.val() || {};
            const normalizedStatus = typeof data.status === 'string' ? data.status.toUpperCase() : 'ACTIVE';
            campaigns.push({
                id: child.key,
                ...data,
                status: normalizedStatus,
                current_amount: data.current_amount ?? data.current_raised ?? 0,
                donor_count: data.donor_count ?? data.supporters ?? 0,
                goal_amount: data.goal_amount ?? 0,
            });
        });

        return campaigns;
    } catch (error) {
        console.error('❌ Error getting campaigns:', error);
        throw error;
    }
};

/**
 * Contribute to campaign
 */
export const contributeToCampaign = async (campaignId, amount) => {
    try {
        const campaignRef = ref(firebaseDatabase, `eco_campaigns/${campaignId}`);
        const snapshot = await get(campaignRef);
        const campaignData = snapshot.val() || {};

        const currentAmount = campaignData.current_amount ?? campaignData.current_raised ?? 0;
        const donorCount = campaignData.donor_count ?? campaignData.supporters ?? 0;
        const goalAmount = campaignData.goal_amount ?? 0;
        const nextAmount = currentAmount + amount;
        const nextStatus = goalAmount > 0 && nextAmount >= goalAmount ? 'FUNDED' : (typeof campaignData.status === 'string' ? campaignData.status.toUpperCase() : 'ACTIVE');

        await update(campaignRef, {
            current_amount: nextAmount,
            donor_count: donorCount + 1,
            status: nextStatus,
            updated_at: Date.now(),
        });

        console.log('✅ Contribution recorded:', amount);
        return true;
    } catch (error) {
        console.error('❌ Error contributing to campaign:', error);
        throw error;
    }
};

// ============================================
// ANIMAL ADOPTION
// ============================================

/**
 * Get available animals for adoption
 */
export const getAnimals = async () => {
    try {
        const animalsRef = ref(firebaseDatabase, 'eco_animals');
        const snapshot = await get(animalsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const animals = [];
        snapshot.forEach((child) => {
            animals.push({
                id: child.key,
                ...child.val(),
            });
        });

        return animals;
    } catch (error) {
        console.error('❌ Error getting animals:', error);
        throw error;
    }
};

/**
 * Adopt animal
 */
export const adoptAnimal = async (firebaseUid, animalId, adoptionData) => {
    try {
        const adoptionRef = ref(firebaseDatabase, `eco_adoptions/${firebaseUid}`);
        const newAdoptionRef = push(adoptionRef);

        const adoption = {
            ...adoptionData,
            animal_id: animalId,
            adopted_at: Date.now(),
            status: 'active',
        };

        await set(newAdoptionRef, adoption);

        // Update animal status
        const animalRef = ref(firebaseDatabase, `eco_animals/${animalId}`);
        await update(animalRef, {
            adopted_by: firebaseUid,
            status: 'adopted',
            adoption_date: Date.now(),
        });

        console.log('✅ Animal adopted:', animalId);
        return newAdoptionRef.key;
    } catch (error) {
        console.error('❌ Error adopting animal:', error);
        throw error;
    }
};

// ============================================
// EVENTS & EMERGENCY REPORTING
// ============================================

/**
 * Create event
 */
export const createEvent = async (eventData) => {
    try {
        const eventsRef = ref(firebaseDatabase, 'eco_events');
        const newEventRef = push(eventsRef);

        const event = {
            ...eventData,
            created_at: Date.now(),
            status: 'active',
            attendees: 0,
        };

        await set(newEventRef, event);
        console.log('✅ Event created:', newEventRef.key);
        return newEventRef.key;
    } catch (error) {
        console.error('❌ Error creating event:', error);
        throw error;
    }
};

/**
 * Get all events
 */
export const getEvents = async () => {
    try {
        const eventsRef = ref(firebaseDatabase, 'eco_events');
        const snapshot = await get(eventsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const events = [];
        snapshot.forEach((child) => {
            events.push({
                id: child.key,
                ...child.val(),
            });
        });

        return events;
    } catch (error) {
        console.error('❌ Error getting events:', error);
        throw error;
    }
};

/**
 * Report emergency
 */
export const reportEmergency = async (firebaseUid, emergencyData) => {
    try {
        const emergenciesRef = ref(firebaseDatabase, 'eco_emergencies');
        const newEmergencyRef = push(emergenciesRef);

        const emergency = {
            ...emergencyData,
            reporter_id: firebaseUid,
            created_at: Date.now(),
            status: 'pending',
        };

        await set(newEmergencyRef, emergency);
        console.log('✅ Emergency reported:', newEmergencyRef.key);
        return newEmergencyRef.key;
    } catch (error) {
        console.error('❌ Error reporting emergency:', error);
        throw error;
    }
};

// ============================================
// NOTIFICATION & MESSAGING
// ============================================

/**
 * Send notification
 */
export const sendNotification = async (userId, notification) => {
    try {
        const notificationsRef = ref(firebaseDatabase, `eco_notifications/${userId}`);
        const newNotificationRef = push(notificationsRef);

        const notif = {
            ...notification,
            created_at: Date.now(),
            read: false,
        };

        await set(newNotificationRef, notif);
        console.log('✅ Notification sent:', newNotificationRef.key);
        return newNotificationRef.key;
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        throw error;
    }
};

/**
 * Get user notifications
 */
export const getNotifications = async (firebaseUid) => {
    try {
        const notificationsRef = ref(firebaseDatabase, `eco_notifications/${firebaseUid}`);
        const snapshot = await get(notificationsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const notifications = [];
        snapshot.forEach((child) => {
            notifications.push({
                id: child.key,
                ...child.val(),
            });
        });

        return notifications.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
        console.error('❌ Error getting notifications:', error);
        throw error;
    }
};

export default {
    initializeEcoUser,
    getUserWallet,
    updateWalletBalance,
    updateImpactStats,
    createItem,
    createScannedItem,
    getItems,
    getItemById,
    getUserItems,
    updateItemStatus,
    deleteItem,
    createTransaction,
    getTransactions,
    createCampaign,
    updateCampaign,
    getCampaigns,
    contributeToCampaign,
    getAnimals,
    adoptAnimal,
    createEvent,
    getEvents,
    reportEmergency,
    sendNotification,
    getNotifications,
};
