import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { firebaseDatabase } from '../config';
import { getAuth } from 'firebase/auth';
import { ref, onValue, push, set, remove } from 'firebase/database';

const List = ({ navigation }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState({});
  const [receivedRequests, setReceivedRequests] = useState({});
  const [friends, setFriends] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser || !firebaseDatabase) {
      setAllUsers([]);
      setLoading(false);
      return;
    }

    // Load all users
    const usersRef = ref(firebaseDatabase, 'users');
    const unsubUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.entries(data)
          .filter(([key]) => key !== currentUser.uid)
          .map(([key, value]) => ({
            id: key,
            ...value,
          }));
        setAllUsers(usersList);
      } else {
        setAllUsers([]);
      }
      setLoading(false);
    });

    // Load sent friend requests
    const sentRef = ref(firebaseDatabase, `friendRequests/${currentUser.uid}/sent`);
    const unsubSent = onValue(sentRef, (snapshot) => {
      setSentRequests(snapshot.val() || {});
    });

    // Load received friend requests
    const receivedRef = ref(firebaseDatabase, `friendRequests/${currentUser.uid}/received`);
    const unsubReceived = onValue(receivedRef, (snapshot) => {
      setReceivedRequests(snapshot.val() || {});
    });

    // Load friends
    const friendsRef = ref(firebaseDatabase, `friends/${currentUser.uid}`);
    const unsubFriends = onValue(friendsRef, (snapshot) => {
      setFriends(snapshot.val() || {});
    });

    return () => {
      unsubUsers();
      unsubSent();
      unsubReceived();
      unsubFriends();
    };
  }, [currentUser]);

  // Send friend request
  const handleSendRequest = async (user) => {
    try {
      // Add to my sent requests
      await set(ref(firebaseDatabase, `friendRequests/${currentUser.uid}/sent/${user.id}`), {
        userId: user.id,
        timestamp: Date.now(),
      });

      // Add to their received requests
      await set(ref(firebaseDatabase, `friendRequests/${user.id}/received/${currentUser.uid}`), {
        userId: currentUser.uid,
        timestamp: Date.now(),
      });

      Alert.alert('Request Sent', `Friend request sent to ${user.name}`);
    } catch (error) {
      console.error('Send request error:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (user) => {
    try {
      // Add to my friends
      await set(ref(firebaseDatabase, `friends/${currentUser.uid}/${user.id}`), {
        ...user,
        addedAt: Date.now(),
      });

      // Add me to their friends
      const myData = allUsers.find(u => u.id === currentUser.uid) || {
        id: currentUser.uid,
        email: currentUser.email,
      };
      await set(ref(firebaseDatabase, `friends/${user.id}/${currentUser.uid}`), {
        ...myData,
        addedAt: Date.now(),
      });

      // Remove from requests
      await remove(ref(firebaseDatabase, `friendRequests/${currentUser.uid}/received/${user.id}`));
      await remove(ref(firebaseDatabase, `friendRequests/${user.id}/sent/${currentUser.uid}`));

      Alert.alert('Friend Added', `${user.name} is now your friend!`);
    } catch (error) {
      console.error('Accept request error:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  // Decline friend request
  const handleDeclineRequest = async (userId) => {
    try {
      await remove(ref(firebaseDatabase, `friendRequests/${currentUser.uid}/received/${userId}`));
      await remove(ref(firebaseDatabase, `friendRequests/${userId}/sent/${currentUser.uid}`));
    } catch (error) {
      console.error('Decline request error:', error);
    }
  };

  // Open chat with friend
  const handleOpenChat = (user) => {
    navigation.navigate('Chat', { users: [user] });
  };

  // Filter users by search
  const filteredUsers = allUsers.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get user status
  const getUserStatus = (user) => {
    if (friends[user.id]) return 'friend';
    if (sentRequests[user.id]) return 'pending';
    if (receivedRequests[user.id]) return 'received';
    return 'none';
  };

  const renderUser = ({ item }) => {
    const status = getUserStatus(item);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={status === 'friend' ? () => handleOpenChat(item) : undefined}
        activeOpacity={status === 'friend' ? 0.7 : 1}
      >
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.08)']}
          style={styles.itemGradient}
        >
          {/* Avatar */}
          <View style={styles.avatar}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {item.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            )}
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: item.status === 'online' ? '#22C55E' : '#64748B' }
              ]}
            />
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name || item.username}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
            {item.phone && (
              <Text style={styles.userPhone}>{item.phone}</Text>
            )}
          </View>

          {/* Action Button */}
          {status === 'none' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleSendRequest(item)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.addButtonGradient}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}

          {status === 'received' && (
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptRequest(item)}
              >
                <Text style={styles.acceptIcon}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => handleDeclineRequest(item.id)}
              >
                <Text style={styles.declineIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'friend' && (
            <View style={styles.friendBadge}>
              <Text style={styles.friendText}>Chat →</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Count pending requests
  const pendingCount = Object.keys(receivedRequests).length;

  if (loading) {
    return (
      <LinearGradient
        colors={['#0A192F', '#0F172A', '#1E293B']}
        style={styles.background}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0A192F', '#0F172A', '#1E293B']}
      style={styles.background}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find People</Text>
        {pendingCount > 0 && (
          <View style={styles.pendingCountBadge}>
            <Text style={styles.pendingCountText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <LinearGradient
          colors={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.8)']}
          style={styles.searchGradient}
        >
          <Image
            source={require('../assets/profile.png')}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor="rgba(148, 163, 184, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>

      {/* Pending Requests Section */}
      {pendingCount > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Friend Requests ({pendingCount})</Text>
        </View>
      )}

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Image
            source={require('../assets/nouser.png')}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  pendingCountBadge: {
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  pendingCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: 'rgba(148, 163, 184, 0.6)',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 15,
  },
  clearSearch: {
    color: 'rgba(148, 163, 184, 0.6)',
    fontSize: 16,
    padding: 4,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userItem: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  avatar: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0A192F',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(148, 163, 184, 0.7)',
  },
  userPhone: {
    fontSize: 12,
    color: 'rgba(102, 126, 234, 0.8)',
    marginTop: 2,
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingText: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#22C55E',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  declineButton: {
    backgroundColor: '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  friendBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  friendText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    tintColor: 'rgba(148, 163, 184, 0.5)',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 0.7)',
  },
});

export default List;
