import { firebaseDatabase, firebaseAuth } from '../config';
import { ref, push, set, update, get } from 'firebase/database';
import { getUserWallet, updateUserWallet } from './ecoService';

/**
 * Animal Adoption Service
 * Manages sponsorships and impact calculations
 */

export const adoptionService = {
  /**
   * Create a new sponsorship
   * @param {string} userId - Firebase UID
   * @param {object} animal - Animal object
   * @returns {Promise}
   */
  createSponsorship: async (userId, animal) => {
    try {
      const sponsorshipsRef = ref(firebaseDatabase, 'eco_sponsorships');
      const newSponsorshipRef = push(sponsorshipsRef);

      const sponsorship = {
        user_id: userId,
        animal_id: animal.id,
        animal_name: animal.name,
        animal_species: animal.species,
        monthly_fee: animal.monthlyFee,
        impact_metric: animal.impactMetric,
        adoption_level: animal.adoptionLevel,
        status: 'active',
        created_at: Date.now(),
        next_charge_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime(),
      };

      await set(newSponsorshipRef, sponsorship);

      // Calculate impact
      const impact = calculateAnimalImpact(animal.monthlyFee);

      // Update user wallet with the adoption amount
      const currentWallet = await getUserWallet(userId);
      const newWalletBalance = (currentWallet?.wallet_balance || 0) - animal.monthlyFee;
      const newAnimalsSaved = (currentWallet?.animals_saved || 0) + 1;

      // Update wallet and animal count
      await updateUserWallet(userId, {
        wallet_balance: Math.max(0, newWalletBalance),
        animals_saved: newAnimalsSaved,
        total_donated: (currentWallet?.total_donated || 0) + animal.monthlyFee,
      });

      console.log('✅ Sponsorship created and wallet updated');

      return {
        sponsorshipId: newSponsorshipRef.key,
        sponsorship,
        impact,
      };
    } catch (error) {
      console.error('❌ Error creating sponsorship:', error);
      throw error;
    }
  },

  /**
   * Get user's active sponsorships
   * @param {string} userId - Firebase UID
   * @returns {Promise<array>}
   */
  getUserSponsorships: async (userId) => {
    try {
      const sponsorshipsRef = ref(
        firebaseDatabase,
        `eco_sponsorships`
      );
      const snapshot = await get(sponsorshipsRef);

      if (!snapshot.exists()) return [];

      const sponsorships = [];
      snapshot.forEach((child) => {
        const data = child.val();
        if (data.user_id === userId && data.status === 'active') {
          sponsorships.push({
            id: child.key,
            ...data,
          });
        }
      });

      return sponsorships;
    } catch (error) {
      console.error('❌ Error fetching sponsorships:', error);
      return [];
    }
  },

  /**
   * Cancel a sponsorship
   * @param {string} sponsorshipId - Sponsorship ID
   * @returns {Promise}
   */
  cancelSponsorship: async (sponsorshipId) => {
    try {
      const sponsorshipRef = ref(
        firebaseDatabase,
        `eco_sponsorships/${sponsorshipId}`
      );

      await update(sponsorshipRef, {
        status: 'cancelled',
        cancelled_at: Date.now(),
      });

      return true;
    } catch (error) {
      console.error('❌ Error cancelling sponsorship:', error);
      throw error;
    }
  },
};

/**
 * Calculate financial impact from donation
 * 70% goes to user wallet, 30% to nature fund
 * @param {number} amount - Monthly fee
 * @returns {object} Impact metrics
 */
export const calculateAnimalImpact = (amount) => {
  const natureFundAmount = amount * 0.30;
  const userWalletAmount = amount * 0.70;

  // Convert nature fund to impact metrics
  // $10 = 1 tree, $5 = 1 animal fed, $20 = 1 habitat protected
  const treesPlanted = Math.floor(natureFundAmount / 10);
  const animalsFed = Math.floor(natureFundAmount / 5);
  const habitatsProtected = Math.floor(natureFundAmount / 20);
  const co2Offset = natureFundAmount * 0.5; // kg CO2

  return {
    userWallet: parseFloat(userWalletAmount.toFixed(2)),
    natureFund: parseFloat(natureFundAmount.toFixed(2)),
    trees: treesPlanted,
    animalsFed,
    habitatsProtected,
    co2Offset: parseFloat(co2Offset.toFixed(1)),
  };
};

/**
 * Update user adoption count
 * @param {string} userId - Firebase UID
 * @param {number} increment - Number to increment by
 * @returns {Promise}
 */
const updateUserAdoptionCount = async (userId, increment) => {
  try {
    // Try to find and update user profile
    const profilesRef = ref(firebaseDatabase, 'profiles');
    const snapshot = await get(profilesRef);

    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const data = child.val();
        if (data.uid === userId) {
          const currentCount = data.animals_saved_count || 0;
          update(ref(firebaseDatabase, `profiles/${child.key}`), {
            animals_saved_count: currentCount + increment,
          });
        }
      });
    }
  } catch (error) {
    console.warn('⚠️ Could not update adoption count:', error.message);
    // Non-critical error, continue
  }
};

/**
 * Get adoption statistics
 * @param {string} userId - Firebase UID
 * @returns {Promise<object>}
 */
export const getAdoptionStats = async (userId) => {
  try {
    const sponsorships = await adoptionService.getUserSponsorships(userId);

    let totalMonthly = 0;
    let totalImpact = {
      trees: 0,
      animalsFed: 0,
      habitatsProtected: 0,
      co2Offset: 0,
    };

    sponsorships.forEach((sponsorship) => {
      totalMonthly += sponsorship.monthly_fee;
      const impact = calculateAnimalImpact(sponsorship.monthly_fee);
      totalImpact.trees += impact.trees;
      totalImpact.animalsFed += impact.animalsFed;
      totalImpact.habitatsProtected += impact.habitatsProtected;
      totalImpact.co2Offset += impact.co2Offset;
    });

    return {
      activeSponsors: sponsorships.length,
      monthlyCommitment: parseFloat(totalMonthly.toFixed(2)),
      totalImpact,
      sponsorships,
    };
  } catch (error) {
    console.error('❌ Error getting adoption stats:', error);
    return {
      activeSponsors: 0,
      monthlyCommitment: 0,
      totalImpact: {
        trees: 0,
        animalsFed: 0,
        habitatsProtected: 0,
        co2Offset: 0,
      },
      sponsorships: [],
    };
  }
};

/**
 * Get mock animal data for initial display
 * @returns {array}
 */
export const getMockAnimals = () => {
  return [
    {
      id: 1,
      name: 'Luna',
      species: 'African Elephant',
      image: 'https://via.placeholder.com/300x300?text=Luna+Elephant',
      status: 'Critical',
      description: 'Orphaned elephant calf needs immediate care and nutrition',
      monthlyFee: 15.0,
      impactMetric: '1 Elephant Fed',
      adoptionLevel: 'Sponsor',
    },
    {
      id: 2,
      name: 'Kavi',
      species: 'Bengal Tiger',
      image: 'https://via.placeholder.com/300x300?text=Kavi+Tiger',
      status: 'Protected',
      description: 'Endangered tiger requiring habitat preservation support',
      monthlyFee: 25.0,
      impactMetric: '1 Tiger Protected',
      adoptionLevel: 'Guardian',
    },
    {
      id: 3,
      name: 'Amara',
      species: 'Polar Bear',
      image: 'https://via.placeholder.com/300x300?text=Amara+Bear',
      status: 'Vulnerable',
      description: 'Arctic bear fighting climate change effects on habitats',
      monthlyFee: 30.0,
      impactMetric: '1 Bear Rescued',
      adoptionLevel: 'Champion',
    },
  ];
};
