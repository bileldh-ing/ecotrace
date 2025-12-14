// Financial Engine - 30% Nature Tax & Impact Calculation
import { CONVERSION_RATES } from '../constants/MockData';
import { getUserWallet, updateWalletBalance, updateImpactStats, createTransaction } from './ecoService';
import { showMessage } from 'react-native-flash-message';

/**
 * Process item sale with 30% Nature Tax
 * @param {string} itemId - Item ID
 * @param {number} salePrice - Total sale price in TND
 * @param {string} userId - Firebase UID
 * @param {string} itemDescription - Description for transaction
 * @returns {Promise<Object>} - Transaction result with impact metrics
 */
export const processItemSale = async (itemId, salePrice, userId, itemDescription = 'Item sold') => {
    try {
        // Calculate split
        const totalAmount = parseFloat(salePrice);
        const wallet = await getUserWallet(userId);
        const rawShare = Number(wallet?.sale_user_share);
        const userShare = Math.min(1, Math.max(0, Number.isFinite(rawShare) ? rawShare : 0.70));

        const userCredited = parseFloat((totalAmount * userShare).toFixed(2));
        const natureFund = parseFloat((totalAmount - userCredited).toFixed(2));

        // Convert nature fund to impact metrics
        const impactMetrics = convertToNatureMetrics(natureFund);

        // Update user wallet
        await updateWalletBalance(userId, userCredited);

        // Update impact stats
        await updateImpactStats(userId, {
            trees: impactMetrics.trees,
            animals: impactMetrics.animals,
            co2: impactMetrics.co2Offset,
            donated: natureFund,
            recycled: true,
        });

        // Create transaction record
        await createTransaction(userId, {
            type: 'SALE',
            amount: totalAmount,
            user_credited: userCredited,
            nature_fund: natureFund,
            user_share: userShare,
            nature_share: parseFloat((1 - userShare).toFixed(2)),
            trees_planted: impactMetrics.trees,
            animals_fed: impactMetrics.animals,
            co2_offset: impactMetrics.co2Offset,
            description: itemDescription,
            reference_type: 'item',
            reference_id: itemId,
        });

        // Show gamified success toast
        displaySuccessToast(totalAmount, userCredited, impactMetrics);

        console.log('✅ Item sale processed successfully');
        return {
            success: true,
            totalAmount,
            userCredited,
            natureFund,
            impactMetrics,
        };
    } catch (error) {
        console.error('❌ Error processing item sale:', error);
        showMessage({
            message: 'Transaction Failed',
            description: 'Unable to process sale. Please try again.',
            type: 'danger',
            icon: 'danger',
            duration: 3000,
        });
        throw error;
    }
};

/**
 * Convert donation amount to nature metrics (trees, animals, CO2)
 * @param {number} donationAmount - Amount in TND
 * @returns {Object} - Impact metrics
 */
export const convertToNatureMetrics = (donationAmount) => {
    const amount = parseFloat(donationAmount);

    return {
        trees: Math.floor(amount / CONVERSION_RATES.TREE_COST),
        animals: Math.floor(amount / CONVERSION_RATES.ANIMAL_COST),
        co2Offset: parseFloat((amount * CONVERSION_RATES.CO2_PER_DOLLAR).toFixed(2)),
    };
};

/**
 * Display gamified success toast with impact metrics
 * @param {number} totalAmount - Total sale amount
 * @param {number} userCredited - Amount credited to user
 * @param {Object} metrics - Impact metrics (trees, animals, co2Offset)
 */
export const displaySuccessToast = (totalAmount, userCredited, metrics) => {
    const { trees, animals, co2Offset } = metrics;

    let impactMessage = `💰 Earned: ${userCredited.toFixed(2)} TND\n`;

    if (trees > 0) {
        impactMessage += `🌳 You planted ${trees} tree${trees > 1 ? 's' : ''}!\n`;
    }
    if (animals > 0) {
        impactMessage += `🐾 You helped ${animals} animal${animals > 1 ? 's' : ''}!\n`;
    }
    if (co2Offset > 0) {
        impactMessage += `🌍 Offset ${co2Offset}kg of CO2!`;
    }

    showMessage({
        message: `✅ Item Sold for ${totalAmount.toFixed(2)} TND!`,
        description: impactMessage,
        type: 'success',
        icon: 'success',
        duration: 5000,
        floating: true,
        backgroundColor: '#2ECC71',
        titleStyle: { fontWeight: '700', fontSize: 16 },
        textStyle: { fontSize: 14, lineHeight: 20 },
    });
};

/**
 * Process event participation reward
 * @param {string} eventId - Event ID
 * @param {string} userId - Firebase UID
 * @param {number} rewardAmount - Reward in TND
 * @param {string} eventTitle - Event title
 */
export const processEventReward = async (eventId, userId, rewardAmount, eventTitle) => {
    try {
        const amount = parseFloat(rewardAmount);

        // Add to wallet
        await updateWalletBalance(userId, amount);

        // Create transaction
        await createTransaction(userId, {
            type: 'EVENT_REWARD',
            amount: amount,
            user_credited: amount,
            nature_fund: 0,
            description: `Reward for attending: ${eventTitle}`,
            reference_type: 'event',
            reference_id: eventId,
        });

        showMessage({
            message: '🎉 Event Reward Earned!',
            description: `You received ${amount.toFixed(2)} TND for participating in "${eventTitle}"`,
            type: 'success',
            icon: 'success',
            duration: 4000,
            backgroundColor: '#00E676',
        });

        console.log(`✅ Event reward processed: ${amount} TND`);
    } catch (error) {
        console.error('❌ Error processing event reward:', error);
        throw error;
    }
};

/**
 * Process campaign donation
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - Firebase UID
 * @param {number} amount - Donation amount in TND
 * @param {string} campaignTitle - Campaign title
 */
export const processCampaignDonation = async (campaignId, userId, amount, campaignTitle) => {
    try {
        const donationAmount = parseFloat(amount);

        // Deduct from wallet
        await updateWalletBalance(userId, -donationAmount);

        // Convert to impact metrics
        const impactMetrics = convertToNatureMetrics(donationAmount);

        // Update impact stats
        await updateImpactStats(userId, {
            trees: impactMetrics.trees,
            animals: impactMetrics.animals,
            co2: impactMetrics.co2Offset,
            donated: donationAmount,
        });

        // Create transaction
        await createTransaction(userId, {
            type: 'DONATION',
            amount: donationAmount,
            user_credited: -donationAmount,
            nature_fund: donationAmount,
            trees_planted: impactMetrics.trees,
            animals_fed: impactMetrics.animals,
            co2_offset: impactMetrics.co2Offset,
            description: `Donation to: ${campaignTitle}`,
            reference_type: 'campaign',
            reference_id: campaignId,
        });

        // Show success message
        displaySuccessToast(donationAmount, 0, impactMetrics);

        console.log(`✅ Donation processed: ${donationAmount} TND`);
    } catch (error) {
        console.error('❌ Error processing donation:', error);
        throw error;
    }
};

/**
 * Calculate user's total environmental impact
 * @param {Object} userData - User data from Firebase
 * @returns {Object} - Formatted impact stats
 */
export const calculateTotalImpact = (userData) => {
    return {
        treesPlanted: userData?.trees_planted || 0,
        animalsSaved: userData?.animals_saved || 0,
        co2Offset: userData?.co2_offset_kg || 0,
        totalDonated: userData?.total_donated || 0,
        itemsRecycled: userData?.total_recycled_items || 0,
        responsibilityScore: userData?.responsibility_score || 0,
    };
};

/**
 * Get formatted impact summary text
 * @param {Object} userData - User data from Firebase
 * @returns {string} - Formatted summary
 */
export const getImpactSummary = (userData) => {
    const impact = calculateTotalImpact(userData);

    return `🌳 ${impact.treesPlanted} trees planted\n🐾 ${impact.animalsSaved} animals helped\n🌍 ${impact.co2Offset}kg CO2 offset\n♻️ ${impact.itemsRecycled} items recycled`;
};

export default {
    processItemSale,
    processEventReward,
    processCampaignDonation,
    convertToNatureMetrics,
    calculateTotalImpact,
    getImpactSummary,
    displaySuccessToast,
};
