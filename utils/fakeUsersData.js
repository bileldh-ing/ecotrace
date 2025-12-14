// Pre-configured fake users data (10 people)
// Structure: { id, name, email, city, phone }

export const FAKE_USERS = [
  {
    id: 'user_001',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com',
    city: 'Cairo',
    phone: '+20 100 123 4567',
  },
  {
    id: 'user_002',
    name: 'Fatima Mohamed',
    email: 'fatima.mohamed@email.com',
    city: 'Alexandria',
    phone: '+20 100 234 5678',
  },
  {
    id: 'user_003',
    name: 'Mohamed Ali',
    email: 'ali.mohamed@email.com',
    city: 'Giza',
    phone: '+20 100 345 6789',
  },
  {
    id: 'user_004',
    name: 'Layla Karim',
    email: 'layla.karim@email.com',
    city: 'Mansoura',
    phone: '+20 100 456 7890',
  },
  {
    id: 'user_005',
    name: 'Ibrahim Saleh',
    email: 'ibrahim.saleh@email.com',
    city: 'Tanta',
    phone: '+20 100 567 8901',
  },
  {
    id: 'user_006',
    name: 'Hana Nour',
    email: 'hana.nour@email.com',
    city: 'Suez',
    phone: '+20 100 678 9012',
  },
  {
    id: 'user_007',
    name: 'Omar Khalil',
    email: 'omar.khalil@email.com',
    city: 'Port Said',
    phone: '+20 100 789 0123',
  },
  {
    id: 'user_008',
    name: 'Zainab Amin',
    email: 'zainab.amin@email.com',
    city: 'Ismailia',
    phone: '+20 100 890 1234',
  },
  {
    id: 'user_009',
    name: 'Karim Fahmy',
    email: 'karim.fahmy@email.com',
    city: 'Zagazig',
    phone: '+20 100 901 2345',
  },
  {
    id: 'user_010',
    name: 'Noor Hasib',
    email: 'noor.hasib@email.com',
    city: 'Aswan',
    phone: '+20 100 012 3456',
  },
];

/**
 * Get all fake users
 */
export const getAllUsers = () => FAKE_USERS;

/**
 * Get a user by ID
 */
export const getUserById = (userId) => {
  return FAKE_USERS.find(user => user.id === userId);
};

/**
 * Sync fake users to Realtime Database
 * Checks if user exists, if not adds them
 */
export const syncUsersWithFirebase = async (firebaseDatabase) => {
  try {
    const { ref, get, set } = await import('firebase/database');
    
    for (const user of FAKE_USERS) {
      const userRef = ref(firebaseDatabase, `users/${user.id}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        await set(userRef, {
          ...user,
          createdAt: Date.now(),
        });
        console.log(`✅ Added missing user: ${user.name}`);
      }
    }
    
    console.log('✅ User sync complete');
  } catch (error) {
    console.error('❌ Error syncing users:', error);
  }
};

export default FAKE_USERS;
