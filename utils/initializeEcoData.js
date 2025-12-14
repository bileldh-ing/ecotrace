// Initialize EcoApp Firebase tables with mock data
import { firebaseDatabase } from '../config';
import { ref, set, get } from 'firebase/database';
import { MOCK_FACTORIES, MOCK_EVENTS, MOCK_ANIMALS, MOCK_CAMPAIGNS } from '../constants/MockData';

/**
 * Initialize all EcoApp tables in Firebase
 * Only runs once on first app launch
 */
export const initializeEcoTables = async () => {
    try {
        // Check if already initialized
        const flagRef = ref(firebaseDatabase, 'eco_initialized');
        const snapshot = await get(flagRef);

        if (snapshot.val() === true) {
            console.log('✅ Eco tables already initialized');
            return false;
        }

        console.log('🚀 Initializing EcoApp tables...');

        // Initialize factories
        await set(ref(firebaseDatabase, 'eco_factories'), MOCK_FACTORIES);
        console.log('✅ Factories initialized');

        // Initialize events
        await set(ref(firebaseDatabase, 'eco_events'), MOCK_EVENTS);
        console.log('✅ Events initialized');

        // Initialize animals
        await set(ref(firebaseDatabase, 'eco_animals'), MOCK_ANIMALS);
        console.log('✅ Animals initialized');

        // Initialize campaigns
        await set(ref(firebaseDatabase, 'eco_campaigns'), MOCK_CAMPAIGNS);
        console.log('✅ Campaigns initialized');

        // Set initialization flag
        await set(flagRef, true);
        console.log('🎉 EcoApp tables initialized successfully!');

        return true;
    } catch (error) {
        console.error('❌ Error initializing EcoApp tables:', error);
        throw error;
    }
};

/**
 * Reset all EcoApp tables (for development/testing only)
 * WARNING: This will delete all eco data!
 */
export const resetEcoTables = async () => {
    try {
        console.warn('⚠️ Resetting all EcoApp tables...');

        await set(ref(firebaseDatabase, 'eco_factories'), null);
        await set(ref(firebaseDatabase, 'eco_events'), null);
        await set(ref(firebaseDatabase, 'eco_animals'), null);
        await set(ref(firebaseDatabase, 'eco_campaigns'), null);
        await set(ref(firebaseDatabase, 'eco_users'), null);
        await set(ref(firebaseDatabase, 'eco_items'), null);
        await set(ref(firebaseDatabase, 'eco_bids'), null);
        await set(ref(firebaseDatabase, 'eco_transactions'), null);
        await set(ref(firebaseDatabase, 'eco_event_registrations'), null);
        await set(ref(firebaseDatabase, 'eco_initialized'), false);

        console.log('✅ EcoApp tables reset complete');
    } catch (error) {
        console.error('❌ Error resetting tables:', error);
        throw error;
    }
};

/**
 * Check if eco tables are initialized
 * @returns {Promise<boolean>}
 */
export const isEcoInitialized = async () => {
    try {
        const flagRef = ref(firebaseDatabase, 'eco_initialized');
        const snapshot = await get(flagRef);
        return snapshot.val() === true;
    } catch (error) {
        console.error('❌ Error checking initialization:', error);
        return false;
    }
};

export default {
    initializeEcoTables,
    resetEcoTables,
    isEcoInitialized,
};
