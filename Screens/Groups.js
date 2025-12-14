import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { firebaseDatabase } from '../config';
import { getAuth } from 'firebase/auth';
import { ref, onValue, get, remove } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import StoryCircle from '../components/StoryCircle';
import StoryService from '../services/StoryService';
import MediaService from '../services/MediaService';
import { Alert, Modal } from 'react-native';

const Groups = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('direct');
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastMessages, setLastMessages] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser || !firebaseDatabase) {
      setFriends([]);
      setLoading(false);
      return;
    }

    // Load friends
    const friendsRef = ref(firebaseDatabase, `friends/${currentUser.uid}`);
    const unsubFriends = onValue(friendsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const friendIds = Object.keys(data);

        // Fetch all user data in parallel using get()
        const userPromises = friendIds.map(async (friendId) => {
          try {
            const userRef = ref(firebaseDatabase, `users/${friendId}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.val();

            return {
              id: friendId,
              ...data[friendId],
              ...(userData || {}),
              // Ensure name fallback
              name: userData?.name || userData?.username || data[friendId]?.name || 'Unknown User',
            };
          } catch (error) {
            console.error('Error fetching user:', friendId, error);
            return {
              id: friendId,
              ...data[friendId],
              name: data[friendId]?.name || 'Unknown User',
            };
          }
        });

        const friendsList = await Promise.all(userPromises);
        console.log('Loaded friends:', friendsList.map(f => ({ id: f.id, name: f.name })));
        setFriends(friendsList);

        // Load last messages for each friend
        friendIds.forEach((friendId) => {
          const chatId = currentUser.uid > friendId
            ? currentUser.uid + friendId
            : friendId + currentUser.uid;
          const messagesRef = ref(firebaseDatabase, `chats/${chatId}/messages`);
          onValue(messagesRef, (msgSnapshot) => {
            const messages = msgSnapshot.val();
            if (messages) {
              const msgArray = Object.values(messages);
              const lastMsg = msgArray[msgArray.length - 1];
              setLastMessages(prev => ({
                ...prev,
                [friendId]: lastMsg
              }));
            }
          });
        });
      } else {
        setFriends([]);
      }
      setLoading(false);
    });

    // Load groups
    const groupsRef = ref(firebaseDatabase, 'groups');
    const unsubGroups = onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const groupsList = Object.values(data).filter(
          g => g.members?.includes(currentUser.uid)
        );
        setGroups(groupsList);
      } else {
        setGroups([]);
      }
    });

    // Load my stories
    const loadMyStories = async () => {
      const active = await StoryService.getActiveStories(currentUser.uid);
      setMyStories(active);
    };
    loadMyStories();

    return () => {
      unsubFriends();
      unsubGroups();
    };
  }, [currentUser]);

  // Add new story
  const handleAddStory = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const mediaUrl = await MediaService.uploadStory(result.assets[0].base64, currentUser.uid);
        await StoryService.addStory(currentUser.uid, mediaUrl, 'image');

        const active = await StoryService.getActiveStories(currentUser.uid);
        setMyStories(active);
      }
    } catch (error) {
      console.error('Add story error:', error);
    }
  };

  const handleStartChat = (user) => {
    navigation.navigate('Chat', { users: [user] });
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleLongPress = (friend) => {
    setSelectedFriend(friend);
    setShowDeleteModal(true);
  };

  const handleDeleteConversation = async () => {
    if (!selectedFriend || !currentUser) return;

    try {
      const chatId = currentUser.uid > selectedFriend.id
        ? currentUser.uid + selectedFriend.id
        : selectedFriend.id + currentUser.uid;

      // Delete chat messages
      const chatRef = ref(firebaseDatabase, `chats/${chatId}`);
      await remove(chatRef);

      Alert.alert('Success', 'Conversation deleted successfully');
      setShowDeleteModal(false);
      setSelectedFriend(null);
    } catch (error) {
      console.error('Delete conversation error:', error);
      Alert.alert('Error', 'Failed to delete conversation');
    }
  };

  const handleLongPressGroup = (group) => {
    setSelectedGroup(group);
    setSelectedFriend(null); // Clear friend selection
    setShowDeleteModal(true);
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup || !currentUser) return;

    try {
      // Remove only current user from group members (leave group)
      const groupRef = ref(firebaseDatabase, `groups/${selectedGroup.id}`);
      const snapshot = await get(groupRef);
      const groupData = snapshot.val();

      if (groupData) {
        const updatedMembers = groupData.members?.filter(m => m !== currentUser.uid) || [];

        if (updatedMembers.length === 0) {
          // Last member - delete the entire group
          await remove(groupRef);
          // Also delete group messages
          const groupChatRef = ref(firebaseDatabase, `groupChats/${selectedGroup.id}`);
          await remove(groupChatRef);
        } else {
          // Update members list (user leaves group)
          const { update } = await import('firebase/database');
          await update(groupRef, { members: updatedMembers });
        }
      }

      Alert.alert('Success', 'You have left the group');
      setShowDeleteModal(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Delete group error:', error);
      Alert.alert('Error', 'Failed to leave group');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderFriend = ({ item }) => {
    const lastMsg = lastMessages[item.id];

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleStartChat(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Image
            source={item.image ? { uri: item.image } : require('../assets/no-photo.png')}
            style={styles.avatarImage}
          />
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: item.status === 'online' ? '#22C55E' : '#64748B' }
            ]}
          />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.name || item.username}</Text>
            {lastMsg && (
              <Text style={styles.chatTime}>{formatTime(lastMsg.timestamp)}</Text>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMsg?.text || 'Tap to start chatting'}
          </Text>
        </View>

        {/* Call Button */}
        {item.phone && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall(item.phone)}
          >
            <Image
              source={require('../assets/call.png')}
              style={styles.callIcon}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('Chat', { group: item })}
      onLongPress={() => handleLongPressGroup(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        {item.icon ? (
          <Image source={{ uri: item.icon }} style={styles.avatarImage} />
        ) : (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {item.name?.charAt(0)?.toUpperCase() || 'G'}
            </Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.members?.length || 0} members
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Empty state component with Lottie
  const EmptyState = ({ icon, title, subtitle }) => (
    <View style={styles.emptyState}>
      <LottieView
        source={require('../assets/nodata.json')}
        autoPlay
        loop
        style={styles.emptyAnimation}
      />
      <Text style={styles.emptyText}>{title}</Text>
      <Text style={styles.emptySubtext}>{subtitle}</Text>
    </View>
  );

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
      {/* Stories Section */}
      <View style={styles.storiesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesScroll}
        >
          <StoryCircle
            user={{ id: currentUser?.uid, name: 'You', image: currentUser?.photoURL }}
            hasUnseenStory={myStories.length > 0}
            isOwnStory
            onPress={myStories.length > 0 ? () => navigation.navigate('StoryViewer', { userId: currentUser.uid, userName: 'You' }) : handleAddStory}
          />
          {friends.map((friend) => (
            <StoryCircle
              key={friend.id}
              user={friend}
              hasUnseenStory={false}
              onPress={() => navigation.navigate('StoryViewer', { userId: friend.id, userName: friend.name })}
            />
          ))}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'direct' && styles.activeTab]}
          onPress={() => setActiveTab('direct')}
        >
          <Image
            source={require('../assets/chat.png')}
            style={[styles.tabIcon, activeTab === 'direct' && styles.activeTabIcon]}
          />
          <Text style={[styles.tabText, activeTab === 'direct' && styles.activeTabText]}>
            Direct
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Image
            source={require('../assets/group.png')}
            style={[styles.tabIcon, activeTab === 'groups' && styles.activeTabIcon]}
          />
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            Groups
          </Text>
          {groups.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{groups.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'direct' ? (
        friends.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            subtitle="Add friends to start chatting"
          />
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.newGroupButton}
            onPress={() => navigation.navigate('NewGroup')}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.newGroupGradient}
            >
              <Text style={styles.newGroupText}>+ Create New Group</Text>
            </LinearGradient>
          </TouchableOpacity>

          {groups.length === 0 ? (
            <EmptyState
              title="No groups yet"
              subtitle="Create a group to chat together"
            />
          ) : (
            <FlatList
              data={groups}
              renderItem={renderGroup}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* Delete Conversation/Group Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowDeleteModal(false); setSelectedGroup(null); setSelectedFriend(null); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setShowDeleteModal(false); setSelectedGroup(null); setSelectedFriend(null); }}
        >
          <View style={styles.deleteModalContent}>
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              style={styles.deleteModalGradient}
            >
              <Image source={require('../assets/trash.png')} style={styles.deleteModalIcon} />
              <Text style={styles.deleteModalTitle}>
                {selectedGroup ? 'Leave Group' : 'Delete Conversation'}
              </Text>
              <Text style={styles.deleteModalSubtitle}>
                {selectedGroup
                  ? `Are you sure you want to leave "${selectedGroup.name}"?`
                  : `Are you sure you want to delete this conversation with ${selectedFriend?.name || selectedFriend?.username}?`
                }
              </Text>
              <Text style={styles.deleteModalWarning}>
                {selectedGroup ? 'You will no longer see messages from this group.' : 'This action cannot be undone.'}
              </Text>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteModalCancelButton}
                  onPress={() => { setShowDeleteModal(false); setSelectedGroup(null); setSelectedFriend(null); }}
                >
                  <Text style={styles.deleteModalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteModalDeleteButton}
                  onPress={selectedGroup ? handleDeleteGroup : handleDeleteConversation}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.deleteButtonGradient}
                  >
                    <Text style={styles.deleteModalDeleteText}>
                      {selectedGroup ? 'Leave' : 'Delete'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Chatbot Button */}
      <TouchableOpacity
        style={styles.floatingChatbot}
        onPress={() => navigation.navigate('ChatBot')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.floatingChatbotGradient}
        >
          <Image
            source={require('../assets/chatbot.png')}
            style={styles.chatbotIcon}
          />
        </LinearGradient>
      </TouchableOpacity>
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
  storiesSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.15)',
  },
  storiesScroll: {
    paddingHorizontal: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  tabIcon: {
    width: 20,
    height: 20,
    tintColor: 'rgba(148, 163, 184, 0.6)',
  },
  activeTabIcon: {
    tintColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(148, 163, 184, 0.6)',
  },
  activeTabText: {
    color: '#667eea',
  },
  tabBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
  },
  avatar: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#0A192F',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  chatTime: {
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.7)',
  },
  lastMessage: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 0.7)',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  callIcon: {
    width: 20,
    height: 20,
    tintColor: '#22C55E',
  },
  newGroupButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  newGroupGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  newGroupText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyAnimation: {
    width: 180,
    height: 180,
    marginBottom: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  deleteModalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  deleteModalIcon: {
    width: 48,
    height: 48,
    tintColor: '#EF4444',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  deleteModalSubtitle: {
    fontSize: 15,
    color: 'rgba(148, 163, 184, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  deleteModalWarning: {
    fontSize: 13,
    color: '#EF4444',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  deleteModalDeleteButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteModalDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Floating Chatbot Button
  floatingChatbot: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingChatbotGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatbotIcon: {
    width: 32,
    height: 32,
    tintColor: '#FFFFFF',
  },
});

export default Groups;
