import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageBackground,
  Alert,
  StatusBar,
  TouchableOpacity,
  Modal,
  Dimensions,
  Linking,
  ScrollView,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { getAuth } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import * as Location from 'expo-location';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import ChatService from '../services/ChatService';
import MediaService from '../services/MediaService';
import PollService from '../services/PollService';
import PollCard from '../components/PollCard';
import { firebaseDatabase } from '../config';
import { ref, onValue, update, set, get, remove, push } from 'firebase/database';
import { supabase } from '../config/supabaseClient';

const { width, height } = Dimensions.get('window');

const Chat = ({ route, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedImageBase64, setAttachedImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [readReceipts, setReadReceipts] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [peerUser, setPeerUser] = useState(null);
  const [peerStatus, setPeerStatus] = useState('offline');
  const [sharedImages, setSharedImages] = useState([]);
  const [quickEmoji, setQuickEmoji] = useState('👍');
  const [chatBackground, setChatBackground] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Group chat state
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [groupMembers, setGroupMembers] = useState({});

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Image viewer state
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Shared photos gallery state
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Edit message state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState('');

  // Add members to group state
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [availableFriends, setAvailableFriends] = useState([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);

  const flatListRef = useRef(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Detect group vs 1-on-1 chat
  const chatUsers = route?.params?.users || [];
  const group = route?.params?.group;

  // Generate chat ID based on type
  const chatId = group
    ? group.id
    : (chatUsers.length > 0 && currentUser
      ? ChatService.getChatId(currentUser.uid, chatUsers[0].id)
      : null);

  useEffect(() => {
    if (!chatId || !currentUser) return;

    // Detect if this is a group chat
    if (group) {
      setIsGroupChat(true);
      setGroupData(group);

      // Load all group members info
      const loadMembers = async () => {
        const membersMap = {};
        if (group.members) {
          for (const memberId of group.members) {
            const userRef = ref(firebaseDatabase, `users/${memberId}`);
            const snapshot = await get(userRef);
            const userData = snapshot.var();
            if (userData) {
              membersMap[memberId] = {
                id: memberId,
                name: userData.name || userData.username || 'Unknown',
                image: userData.image,
              };
            }
          }
        }
        setGroupMembers(membersMap);
      };
      loadMembers();
    } else {
      setIsGroupChat(false);
      // Set peer user info for 1-on-1
      if (chatUsers.length > 0) {
        setPeerUser(chatUsers[0]);
      }
    }

    // Load chat settings (background, quick emoji)
    const settingsRef = ref(firebaseDatabase, `chatSettings/${chatId}`);
    onValue(settingsRef, (snapshot) => {
      const settings = snapshot.val();
      if (settings) {
        setChatBackground(settings.background || null);
        setQuickEmoji(settings.quickEmoji || '👍');
      }
    });

    // Subscribe to messages (different path for groups)
    const messagesPath = group ? `groupChats/${chatId}/messages` : `chats/${chatId}/messages`;
    console.log('📨 Subscribing to messages at path:', messagesPath);
    const messagesRef = ref(firebaseDatabase, messagesPath);
    const unsubMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('📨 Messages received:', data ? Object.keys(data).length : 0, 'messages', 'isGroupChat:', !!group);
      if (data) {
        const msgs = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        // Filter out deleted for current user
        const filtered = msgs.filter(m => !m.deletedFor?.includes(currentUser.uid));
        console.log('📨 Filtered messages count:', filtered.length);
        setMessages(filtered);

        // Collect shared images
        const images = filtered.filter(m => m.imageUrl).map(m => m.imageUrl);
        setSharedImages(images);

        // Update read receipt
        if (filtered.length > 0) {
          ChatService.updateReadReceipt(chatId, currentUser.uid, filtered[filtered.length - 1].id);
        }

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log('📨 No messages found at path:', messagesPath);
        setMessages([]);
      }
    });

    // Subscribe to typing
    const unsubTyping = ChatService.subscribeToTyping(chatId, currentUser.uid, setTypingUsers);

    // Subscribe to read receipts
    const unsubReceipts = ChatService.subscribeToReadReceipts(chatId, setReadReceipts);

    // Subscribe to peer status (1-on-1 only)
    let unsubStatus = () => { };
    if (!group && chatUsers.length > 0) {
      const userRef = ref(firebaseDatabase, `users/${chatUsers[0].id}`);
      unsubStatus = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setPeerUser(prev => ({ ...prev, ...data }));
          setPeerStatus(data.status || 'offline');
        }
      });
    }

    return () => {
      unsubMessages();
      unsubTyping();
      unsubReceipts();
      unsubStatus();
      // Clear typing on leave
      ChatService.setTyping(chatId, currentUser.uid, false);
    };
  }, [chatId, currentUser]);

  const handleTextChange = (text) => {
    setMessageText(text);
    if (chatId && currentUser) {
      ChatService.setTyping(chatId, currentUser.uid, text.length > 0);
    }
  };

  const handleSend = async (emojiOnly) => {
    if (!chatId || !currentUser) return;

    const textToSend = emojiOnly || messageText.trim();
    if (!textToSend && !attachedImage) return;

    setLoading(true);
    ChatService.setTyping(chatId, currentUser.uid, false);

    try {
      let imageUrl = null;
      if (attachedImageBase64) {
        imageUrl = await MediaService.uploadChatImage(attachedImageBase64, chatId);
      }

      console.log('Sending message:', { chatId, sender: currentUser.uid, receiver: peerUser?.id, text: textToSend, imageUrl });

      // Use different path for group vs 1-on-1 chats
      if (isGroupChat) {
        // Send directly to groupChats path
        const messagesRef = ref(firebaseDatabase, `groupChats/${chatId}/messages`);
        const newMsgRef = push(messagesRef);
        await set(newMsgRef, {
          id: newMsgRef.key,
          sender: currentUser.uid,
          text: textToSend || '',
          imageUrl: imageUrl,
          replyTo: replyingTo?.id || null,
          timestamp: Date.now(),
          deletedFor: [],
        });
      } else {
        // Use ChatService for 1-on-1 chats
        await ChatService.sendMessage(
          chatId,
          currentUser.uid,
          peerUser?.id || null,
          textToSend,
          imageUrl,
          null,
          replyingTo?.id || null
        );
      }

      setMessageText('');
      setAttachedImage(null);
      setAttachedImageBase64(null);
      setReplyingTo(null);
    } catch (error) {
      console.error('Send error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleStopVoice = async (uri) => {
    console.log('handleStopVoice called with uri:', uri);
    setIsRecording(false);

    if (!chatId || !currentUser || !uri) {
      console.log('handleStopVoice early return:', { chatId, currentUser: !!currentUser, uri });
      return;
    }

    try {
      console.log('Uploading voice message to Supabase...');
      const voiceUrl = await MediaService.uploadVoiceMessage(uri, currentUser.uid);
      console.log('Voice message uploaded:', voiceUrl);

      // Use correct path for group vs 1-on-1
      if (isGroupChat) {
        const messagesRef = ref(firebaseDatabase, `groupChats/${chatId}/messages`);
        const newMsgRef = push(messagesRef);
        await set(newMsgRef, {
          id: newMsgRef.key,
          sender: currentUser.uid,
          text: '',
          voiceUrl: voiceUrl,
          timestamp: Date.now(),
          deletedFor: [],
        });
      } else {
        await ChatService.sendMessage(
          chatId,
          currentUser.uid,
          peerUser?.id || null,
          '',
          null,
          voiceUrl,
          null
        );
      }
      console.log('Voice message sent successfully');
    } catch (error) {
      console.error('Voice message error:', error);
      Alert.alert('Error', 'Failed to send voice message: ' + error.message);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        // Flexible cropping - no fixed aspect ratio, user can adjust freely
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setAttachedImage(result.assets[0].uri);
        setAttachedImageBase64(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Pick image error:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        // Flexible cropping for camera photos too
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setAttachedImage(result.assets[0].uri);
        setAttachedImageBase64(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Take photo error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handlePhoneCall = () => {
    if (peerUser?.phone) {
      Linking.openURL(`tel:${peerUser.phone}`);
    } else {
      Alert.alert('No Phone Number', 'This user has not added a phone number.');
    }
  };

  const handleShareLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to share your location.');
        return;
      }

      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const locationText = `📍 My Location: ${mapsUrl}`;

      // Use correct path for group vs 1-on-1
      if (isGroupChat) {
        const messagesRef = ref(firebaseDatabase, `groupChats/${chatId}/messages`);
        const newMsgRef = push(messagesRef);
        await set(newMsgRef, {
          id: newMsgRef.key,
          sender: currentUser.uid,
          text: locationText,
          timestamp: Date.now(),
          deletedFor: [],
        });
      } else {
        await ChatService.sendMessage(
          chatId,
          currentUser.uid,
          peerUser?.id || null,
          locationText,
          null,
          null,
          null
        );
      }

      Alert.alert('Success', 'Location shared successfully!');
    } catch (error) {
      console.error('Share location error:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLongPress = (message) => {
    setSelectedMessage(message);
    setShowDeleteModal(true);
  };

  const handleDoubleTap = async (message) => {
    // Add heart reaction
    if (!chatId || !currentUser) return;
    try {
      const messagesPath = isGroupChat ? `groupChats/${chatId}/messages` : `chats/${chatId}/messages`;
      const msgRef = ref(firebaseDatabase, `${messagesPath}/${message.id}/reactions/${currentUser.uid}`);
      await set(msgRef, '❤️');
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  // Check if message can be deleted for everyone (within 10 minutes)
  const canDeleteForEveryone = (message) => {
    if (!message || message.sender !== currentUser?.uid) return false;
    const TEN_MINUTES = 10 * 60 * 1000;
    return (Date.now() - message.timestamp) < TEN_MINUTES;
  };

  // Check if message can be edited (sender only, within 10 minutes)
  const canEditMessage = (message) => {
    if (!message || message.sender !== currentUser?.uid) return false;
    if (!message.text || message.text.trim() === '') return false; // Can't edit images/voice only
    const TEN_MINUTES = 10 * 60 * 1000;
    return (Date.now() - message.timestamp) < TEN_MINUTES;
  };

  const handleDelete = async (forEveryone) => {
    if (!selectedMessage || !chatId || !currentUser) return;

    try {
      const messagesPath = isGroupChat ? `groupChats/${chatId}/messages` : `chats/${chatId}/messages`;

      if (forEveryone) {
        // Replace content with "Message Deleted" placeholder
        const msgRef = ref(firebaseDatabase, `${messagesPath}/${selectedMessage.id}`);
        await update(msgRef, {
          text: '🚫 This message was deleted',
          imageUrl: null,
          voiceUrl: null,
          deleted: true,
        });
      } else {
        // Add current user to deletedFor array
        const msgRef = ref(firebaseDatabase, `${messagesPath}/${selectedMessage.id}`);
        const snapshot = await get(msgRef);
        const message = snapshot.val();
        if (message) {
          const deletedFor = message.deletedFor || [];
          if (!deletedFor.includes(currentUser.uid)) {
            deletedFor.push(currentUser.uid);
            await update(msgRef, { deletedFor });
          }
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
    setShowDeleteModal(false);
    setSelectedMessage(null);
  };

  const handleEditMessage = async () => {
    if (!selectedMessage || !chatId || !currentUser || !editText.trim()) return;

    try {
      const messagesPath = isGroupChat ? `groupChats/${chatId}/messages` : `chats/${chatId}/messages`;
      const msgRef = ref(firebaseDatabase, `${messagesPath}/${selectedMessage.id}`);
      await update(msgRef, {
        text: editText.trim(),
        edited: true,
        editedAt: Date.now(),
      });
      Alert.alert('Success', 'Message edited');
    } catch (error) {
      console.error('Edit error:', error);
      Alert.alert('Error', 'Failed to edit message');
    }
    setShowEditModal(false);
    setEditText('');
    setSelectedMessage(null);
  };

  // Handle quick emoji change - immediately updates and saves to Firebase
  const handleChangeQuickEmoji = async (emoji) => {
    setQuickEmoji(emoji); // Immediate UI update
    setShowEmojiModal(false);

    try {
      const settingsRef = ref(firebaseDatabase, `chatSettings/${chatId}`);
      await update(settingsRef, { quickEmoji: emoji });
    } catch (error) {
      console.error('Quick emoji save error:', error);
    }
  };

  const handleChangeBackground = async () => {
    try {
      console.log('Starting background change...');
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      console.log('Image picker result:', result.canceled ? 'canceled' : 'success');

      if (!result.canceled && result.assets[0]?.base64) {
        console.log('Uploading background to Supabase...');
        const bgUrl = await MediaService.uploadBackground(result.assets[0].base64, chatId);
        console.log('Background uploaded:', bgUrl);

        // Add cache-busting timestamp to force mobile refresh
        const cachedBgUrl = `${bgUrl}?t=${Date.now()}`;

        const settingsRef = ref(firebaseDatabase, `chatSettings/${chatId}`);
        await update(settingsRef, { background: cachedBgUrl });
        setChatBackground(cachedBgUrl);
        setShowMenuModal(false);
        Alert.alert('Success', 'Background changed successfully!');
      }
    } catch (error) {
      console.error('Background change error:', error);
      Alert.alert('Error', 'Failed to change background: ' + error.message);
    }
  };

  // Handle swipe to reply
  const handleSwipeReply = (message) => {
    setReplyingTo(message);
  };

  // Handle opening add members modal (groups only)
  const handleOpenAddMembers = async () => {
    if (!currentUser || !groupData) return;

    setShowMenuModal(false);

    try {
      // Load user's friends
      const friendsRef = ref(firebaseDatabase, `friends/${currentUser.uid}`);
      const snapshot = await get(friendsRef);
      const friendsData = snapshot.val();

      if (friendsData) {
        const friendIds = Object.keys(friendsData);
        const currentMembers = groupData.members || [];

        // Get friend details and filter out existing members
        const friendPromises = friendIds
          .filter(fid => !currentMembers.includes(fid))
          .map(async (fid) => {
            const userRef = ref(firebaseDatabase, `users/${fid}`);
            const userSnap = await get(userRef);
            const userData = userSnap.val();
            return {
              id: fid,
              name: userData?.name || userData?.username || 'Unknown',
              image: userData?.image,
            };
          });

        const friends = await Promise.all(friendPromises);
        setAvailableFriends(friends);
        setSelectedNewMembers([]);
        setShowAddMembersModal(true);
      } else {
        Alert.alert('No Friends', 'Add some friends first to invite them to the group.');
      }
    } catch (error) {
      console.error('Load friends error:', error);
      Alert.alert('Error', 'Failed to load friends');
    }
  };

  // Toggle member selection
  const toggleMemberSelection = (friendId) => {
    setSelectedNewMembers(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  // Add selected members to group
  const handleAddMembersToGroup = async () => {
    if (!groupData || selectedNewMembers.length === 0) return;

    try {
      const groupRef = ref(firebaseDatabase, `groups/${groupData.id}`);
      const newMembers = [...(groupData.members || []), ...selectedNewMembers];
      await update(groupRef, { members: newMembers });

      // Update local state
      setGroupData({ ...groupData, members: newMembers });
      setShowAddMembersModal(false);
      setSelectedNewMembers([]);

      Alert.alert('Success', `Added ${selectedNewMembers.length} member(s) to the group!`);
    } catch (error) {
      console.error('Add members error:', error);
      Alert.alert('Error', 'Failed to add members');
    }
  };

  // Handle poll creation
  const handleCreatePoll = async () => {
    const validOptions = pollOptions.filter(opt => opt.trim());
    if (!pollQuestion.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please add at least 2 options');
      return;
    }

    try {
      setLoading(true);
      const poll = await PollService.createPoll(
        chatId,
        currentUser.uid,
        pollQuestion.trim(),
        validOptions
      );

      // Send poll as a special message
      const messagesPath = isGroupChat ? `groupChats/${chatId}/messages` : `chats/${chatId}/messages`;
      const messagesRef = ref(firebaseDatabase, messagesPath);
      const newMsgRef = push(messagesRef);
      await set(newMsgRef, {
        id: newMsgRef.key,
        sender: currentUser.uid,
        type: 'poll',
        pollId: poll.id,
        timestamp: Date.now(),
        deletedFor: [],
      });

      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (error) {
      console.error('Create poll error:', error);
      Alert.alert('Error', 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  // Add poll option
  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  // Update poll option
  const updatePollOption = (index, text) => {
    const newOptions = [...pollOptions];
    newOptions[index] = text;
    setPollOptions(newOptions);
  };

  // Handle bulk media deletion with background processing
  const handleBulkDeleteMedia = async () => {
    if (sharedImages.length === 0) return;

    // Store images to delete before clearing
    const imagesToDelete = [...sharedImages];

    // Optimistic UI update - immediately clear from view
    setSharedImages([]);
    setShowBulkDeleteModal(false);
    setShowGalleryModal(false);

    // Background deletion process (non-blocking)
    const deleteInBackground = async () => {
      try {
        // Find all messages with images in this chat
        const messagesPath = isGroupChat ? `groupChats/${chatId}/messages` : `chats/${chatId}/messages`;
        const messagesRef = ref(firebaseDatabase, messagesPath);
        const snapshot = await get(messagesRef);

        if (snapshot.exists()) {
          const messagesData = snapshot.val();

          for (const [msgId, msg] of Object.entries(messagesData)) {
            if (msg.imageUrl && imagesToDelete.includes(msg.imageUrl)) {
              try {
                // Extract file path from Supabase URL
                const urlParts = msg.imageUrl.split('/storage/v1/object/public/');
                if (urlParts.length > 1) {
                  const filePath = urlParts[1].split('?')[0]; // Remove query params
                  const bucket = filePath.split('/')[0];
                  const path = filePath.substring(bucket.length + 1);

                  // Delete from Supabase Storage
                  await supabase.storage.from(bucket).remove([path]);
                }

                // Update Firebase message
                const msgRef = ref(firebaseDatabase, `${messagesPath}/${msgId}`);
                await update(msgRef, {
                  imageUrl: null,
                  text: '📷 Photo deleted',
                });
              } catch (err) {
                console.error('Error deleting media:', err);
              }
            }
          }
        }
      } catch (error) {
        console.error('Background deletion error:', error);
      }
    };

    // Run deletion in background (non-blocking)
    deleteInBackground();
  };

  const renderMessage = ({ item, index }) => {
    console.log('🎨 Rendering message:', index, item.id, 'text:', item.text?.substring(0, 20), 'isGroupChat:', isGroupChat);
    const isOwn = item.sender === currentUser?.uid;

    // For group chats, get sender info from groupMembers
    const senderInfo = isGroupChat && !isOwn ? groupMembers[item.sender] : null;

    // Read receipt logic (1-on-1 only for now)
    const peerReceipt = !isGroupChat ? readReceipts[peerUser?.id] : null;
    const showReadReceipt = !isGroupChat && isOwn && peerReceipt?.lastSeenMessageId === item.id;
    const seenTimestamp = showReadReceipt ? peerReceipt?.timestamp : null;

    // Check if this is a poll message
    if (item.type === 'poll' && item.pollId) {
      return (
        <View style={{ marginVertical: 8, width: '100%' }}>
          <PollCard
            pollId={item.pollId}
            currentUserId={currentUser?.uid}
          />
        </View>
      );
    }

    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        peerAvatar={peerUser?.image}
        peerName={peerUser?.name || peerUser?.username}
        showReadReceipt={showReadReceipt}
        seenTimestamp={seenTimestamp}
        onLongPress={() => handleLongPress(item)}
        onDoubleTap={() => handleDoubleTap(item)}
        onSwipeReply={handleSwipeReply}
        onImagePress={(imageUrl) => {
          setSelectedImage(imageUrl);
          setShowImageViewer(true);
        }}
        messages={messages}
        isGroupChat={isGroupChat}
        senderInfo={senderInfo}
      />
    );
  };

  // Get typing user name
  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    const displayName = peerUser?.name || peerUser?.username;
    if (displayName) {
      return `${displayName.split(' ')[0]} is typing...`;
    }
    return 'Typing...';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A192F" />
      <LinearGradient colors={['#0A192F', '#0F172A', '#1E293B']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image
                source={require('../assets/left-arrow.png')}
                style={styles.backIcon}
              />
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <View style={styles.headerAvatar}>
                <Image
                  source={
                    isGroupChat
                      ? (groupData?.icon ? { uri: groupData.icon } : require('../assets/group.png'))
                      : (peerUser?.image ? { uri: peerUser.image } : require('../assets/no-photo.png'))
                  }
                  style={styles.avatarImage}
                />
                {!isGroupChat && (
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: peerStatus === 'online' ? '#22C55E' : '#64748B' }
                    ]}
                  />
                )}
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerName}>
                  {isGroupChat ? groupData?.name : (peerUser?.name || peerUser?.username || 'Chat')}
                </Text>
                <Text style={styles.headerStatus}>
                  {isGroupChat
                    ? `${Object.keys(groupMembers).length} members`
                    : (typingUsers.length > 0 ? getTypingText() : peerStatus === 'online' ? 'Online' : 'Offline')
                  }
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={handlePhoneCall} style={styles.headerButton}>
              <Image
                source={require('../assets/phone.png')}
                style={styles.headerIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowMenuModal(true)} style={styles.headerButton}>
              <Image
                source={require('../assets/menu.png')}
                style={styles.headerIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Chat Content with Background - using ImageBackground for mobile */}
          <ImageBackground
            source={chatBackground ? { uri: chatBackground } : require('../assets/chat_back.jpg')}
            style={styles.backgroundContainer}
            imageStyle={styles.backgroundImageStyle}
            resizeMode="cover"
          >
            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            />

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <View style={styles.typingContainer}>
                <LottieView
                  source={require('../assets/typing.json')}
                  autoPlay
                  loop
                  style={styles.typingAnimation}
                />
                <Text style={styles.typingText}>
                  {getTypingText()}
                </Text>
              </View>
            )}
          </ImageBackground>

          {/* Chat Input */}
          <ChatInput
            value={messageText}
            onChangeText={handleTextChange}
            onSend={handleSend}
            onPickImage={handlePickImage}
            onTakePhoto={handleTakePhoto}
            onCreatePoll={() => setShowPollModal(true)}
            isGroupChat={isGroupChat}
            attachedImage={attachedImage}
            onRemoveImage={() => {
              setAttachedImage(null);
              setAttachedImageBase64(null);
            }}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            disabled={loading}
            onPhoneCall={handlePhoneCall}
            quickEmoji={quickEmoji}
            onQuickEmojiChange={() => setShowEmojiModal(true)}
            isRecording={isRecording}
            onStartVoice={() => setIsRecording(true)}
            onStopVoice={handleStopVoice}
          />
        </KeyboardAvoidingView>

        {/* Delete Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDeleteModal(false)}
          >
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalTitle}>Message Options</Text>

              {/* Edit Option (only for own messages with text, within 10 min) */}
              {canEditMessage(selectedMessage) && (
                <TouchableOpacity
                  style={styles.editOption}
                  onPress={() => {
                    setEditText(selectedMessage?.text || '');
                    setShowDeleteModal(false);
                    setShowEditModal(true);
                  }}
                >
                  <Image source={require('../assets/edit.png')} style={styles.optionIcon} />
                  <Text style={styles.editOptionText}>Edit Message</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.deleteOption}
                onPress={() => handleDelete(false)}
              >
                <Image source={require('../assets/trash.png')} style={styles.optionIcon} />
                <Text style={styles.deleteOptionText}>Delete for Me</Text>
              </TouchableOpacity>

              {/* Delete for Everyone (only within 10 min window) */}
              {canDeleteForEveryone(selectedMessage) && (
                <TouchableOpacity
                  style={[styles.deleteOption, styles.deleteOptionDanger]}
                  onPress={() => handleDelete(true)}
                >
                  <Image source={require('../assets/trash.png')} style={styles.optionIconDanger} />
                  <Text style={styles.deleteOptionTextDanger}>Delete for Everyone</Text>
                </TouchableOpacity>
              )}

              {/* Copy Option */}
              {selectedMessage?.text && !selectedMessage?.deleted && (
                <TouchableOpacity
                  style={styles.copyOption}
                  onPress={async () => {
                    await Clipboard.setStringAsync(selectedMessage.text);
                    Alert.alert('Copied', 'Message copied to clipboard');
                    setShowDeleteModal(false);
                    setSelectedMessage(null);
                  }}
                >
                  <Image source={require('../assets/copy.png')} style={styles.copyIcon} />
                  <Text style={styles.copyOptionText}>Copy Message</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelOption}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Edit Message Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalContent}>
              <Text style={styles.editModalTitle}>Edit Message</Text>
              <TextInput
                style={styles.editModalInput}
                value={editText}
                onChangeText={setEditText}
                multiline
                autoFocus
                placeholder="Enter new message..."
                placeholderTextColor="rgba(148, 163, 184, 0.5)"
              />
              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => {
                    setShowEditModal(false);
                    setEditText('');
                    setSelectedMessage(null);
                  }}
                >
                  <Text style={styles.editCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editSaveBtn}
                  onPress={handleEditMessage}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.editSaveGradient}
                  >
                    <Text style={styles.editSaveText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Menu Modal */}
        <Modal
          visible={showMenuModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMenuModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMenuModal(false)}
          >
            <View style={styles.menuModalContent}>
              <Text style={styles.menuTitle}>Chat Settings</Text>

              {/* Shared Photos */}
              {sharedImages.length > 0 && (
                <View style={styles.menuSection}>
                  <Text style={styles.menuSectionTitle}>Shared Photos ({sharedImages.length})</Text>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => { setShowMenuModal(false); setShowGalleryModal(true); }}
                  >
                    <Text style={styles.menuItemText}>📸 Shared Photos ({sharedImages.length})</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Add Members (Groups only) */}
              {isGroupChat && (
                <TouchableOpacity style={styles.menuItem} onPress={handleOpenAddMembers}>
                  <Text style={styles.menuItemText}>👥 Add Members</Text>
                </TouchableOpacity>
              )}

              {/* Change Background */}
              <TouchableOpacity style={styles.menuItem} onPress={handleChangeBackground}>
                <Text style={styles.menuItemText}>Change Background</Text>
              </TouchableOpacity>

              {/* Change Quick Emoji */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenuModal(false); setShowEmojiModal(true); }}>
                <Text style={styles.menuItemText}>Change Quick Emoji ({quickEmoji})</Text>
              </TouchableOpacity>

              {/* Share Location */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenuModal(false); handleShareLocation(); }}>
                <Text style={styles.menuItemText}>📍 Share My Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeMenuItem}
                onPress={() => setShowMenuModal(false)}
              >
                <Text style={styles.closeMenuText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Emoji Picker Modal */}
        <Modal
          visible={showEmojiModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEmojiModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEmojiModal(false)}
          >
            <View style={styles.emojiPickerContainer}>
              <Text style={styles.emojiPickerTitle}>Select Quick Emoji</Text>
              <View style={styles.emojiGrid}>
                {['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '💯'].map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.emojiOption, quickEmoji === emoji && styles.selectedEmoji]}
                    onPress={() => handleChangeQuickEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Poll Creation Modal */}
        <Modal
          visible={showPollModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPollModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pollModalContent}>
              <Text style={styles.pollModalTitle}>Create Poll</Text>

              {/* Question Input */}
              <TextInput
                style={styles.pollQuestionInput}
                placeholder="Ask a question..."
                placeholderTextColor="rgba(148, 163, 184, 0.6)"
                value={pollQuestion}
                onChangeText={setPollQuestion}
                multiline
              />

              {/* Options */}
              <Text style={styles.pollOptionsLabel}>Options</Text>
              {pollOptions.map((option, index) => (
                <TextInput
                  key={index}
                  style={styles.pollOptionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor="rgba(148, 163, 184, 0.6)"
                  value={option}
                  onChangeText={(text) => updatePollOption(index, text)}
                />
              ))}

              {pollOptions.length < 6 && (
                <TouchableOpacity style={styles.addOptionButton} onPress={addPollOption}>
                  <Text style={styles.addOptionText}>+ Add Option</Text>
                </TouchableOpacity>
              )}

              {/* Buttons */}
              <View style={styles.pollModalButtons}>
                <TouchableOpacity
                  style={styles.pollCancelButton}
                  onPress={() => {
                    setShowPollModal(false);
                    setPollQuestion('');
                    setPollOptions(['', '']);
                  }}
                >
                  <Text style={styles.pollCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pollCreateButton}
                  onPress={handleCreatePoll}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.pollCreateGradient}
                  >
                    <Text style={styles.pollCreateText}>
                      {loading ? 'Creating...' : 'Create Poll'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Members Modal (Groups only) */}
        <Modal
          visible={showAddMembersModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddMembersModal(false)}
        >
          <View style={styles.addMembersOverlay}>
            <View style={styles.addMembersContent}>
              <Text style={styles.addMembersTitle}>Add Members</Text>
              <Text style={styles.addMembersSubtitle}>
                Select friends to add to {groupData?.name}
              </Text>

              {availableFriends.length === 0 ? (
                <Text style={styles.noFriendsText}>
                  All your friends are already in this group
                </Text>
              ) : (
                <FlatList
                  data={availableFriends}
                  keyExtractor={(item) => item.id}
                  style={styles.membersList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.memberItem,
                        selectedNewMembers.includes(item.id) && styles.memberItemSelected
                      ]}
                      onPress={() => toggleMemberSelection(item.id)}
                    >
                      <Image
                        source={item.image ? { uri: item.image } : require('../assets/no-photo.png')}
                        style={styles.memberAvatar}
                      />
                      <Text style={styles.memberName}>{item.name}</Text>
                      <View style={[
                        styles.memberCheckbox,
                        selectedNewMembers.includes(item.id) && styles.memberCheckboxSelected
                      ]}>
                        {selectedNewMembers.includes(item.id) && (
                          <Text style={styles.checkMark}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}

              <View style={styles.addMembersButtons}>
                <TouchableOpacity
                  style={styles.addMembersCancelBtn}
                  onPress={() => {
                    setShowAddMembersModal(false);
                    setSelectedNewMembers([]);
                  }}
                >
                  <Text style={styles.addMembersCancelText}>Cancel</Text>
                </TouchableOpacity>

                {selectedNewMembers.length > 0 && (
                  <TouchableOpacity
                    style={styles.addMembersConfirmBtn}
                    onPress={handleAddMembersToGroup}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.addMembersConfirmGradient}
                    >
                      <Text style={styles.addMembersConfirmText}>
                        Add ({selectedNewMembers.length})
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Full-Screen Image Viewer Modal */}
        <Modal
          visible={showImageViewer}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImageViewer(false)}
        >
          <View style={styles.imageViewerOverlay}>
            <TouchableOpacity
              style={styles.imageViewerClose}
              onPress={() => setShowImageViewer(false)}
            >
              <Text style={styles.imageViewerCloseText}>✕</Text>
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>

        {/* Shared Photos Gallery Modal */}
        <Modal
          visible={showGalleryModal}
          animationType="slide"
          onRequestClose={() => setShowGalleryModal(false)}
        >
          <View style={styles.galleryContainer}>
            <View style={styles.galleryHeader}>
              <TouchableOpacity onPress={() => setShowGalleryModal(false)}>
                <Image source={require('../assets/left-arrow.png')} style={styles.galleryBackIcon} />
              </TouchableOpacity>
              <Text style={styles.galleryTitle}>Shared Photos ({sharedImages.length})</Text>
              <View style={{ width: 40 }} />
            </View>

            <FlatList
              data={sharedImages}
              numColumns={3}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.galleryGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedImage(item);
                    setShowGalleryModal(false);
                    setShowImageViewer(true);
                  }}
                >
                  <Image source={{ uri: item }} style={styles.galleryImage} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.galleryEmptyText}>No shared photos yet</Text>
              }
            />

            {/* Delete All Button (only for 1-on-1 chats) */}
            {!isGroupChat && sharedImages.length > 0 && (
              <TouchableOpacity
                style={styles.deleteAllButton}
                onPress={() => setShowBulkDeleteModal(true)}
              >
                <Image source={require('../assets/trash.png')} style={styles.trashIcon} />
                <Text style={styles.deleteAllText}>Delete All Shared Media</Text>
              </TouchableOpacity>
            )}
          </View>
        </Modal>

        {/* Bulk Delete Confirmation Modal */}
        <Modal
          visible={showBulkDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBulkDeleteModal(false)}
        >
          <View style={styles.bulkDeleteOverlay}>
            <View style={styles.bulkDeleteCard}>
              <Image source={require('../assets/trash.png')} style={styles.bulkDeleteIcon} />
              <Text style={styles.bulkDeleteTitle}>Delete All Media?</Text>
              <Text style={styles.bulkDeleteMessage}>
                This will permanently delete {sharedImages.length} photo(s) from this conversation.
              </Text>

              <View style={styles.bulkDeleteButtons}>
                <TouchableOpacity
                  style={styles.bulkDeleteCancelBtn}
                  onPress={() => setShowBulkDeleteModal(false)}
                >
                  <Text style={styles.bulkDeleteCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bulkDeleteConfirmBtn}
                  onPress={handleBulkDeleteMedia}
                >
                  <Text style={styles.bulkDeleteConfirmText}>Delete All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#E2E8F0',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    position: 'relative',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0A192F',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.8)',
    marginTop: 2,
  },
  headerButton: {
    padding: 10,
  },
  headerIcon: {
    width: 22,
    height: 22,
    tintColor: '#667eea',
  },
  backgroundContainer: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.35,
  },
  messagesList: {
    flex: 1,
    zIndex: 10,
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    zIndex: 10,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingAnimation: {
    width: 40,
    height: 24,
    maxWidth: 50,
  },
  typingText: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  deleteModalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    marginBottom: 10,
  },
  deleteOptionText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteOptionDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteOptionTextDanger: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  cancelOption: {
    paddingVertical: 16,
  },
  cancelOptionText: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  copyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  copyIcon: {
    width: 18,
    height: 18,
    tintColor: '#667eea',
    marginRight: 8,
  },
  copyOptionText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '500',
  },
  menuModalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: height * 0.7,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 20,
  },
  menuSection: {
    marginBottom: 20,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(148, 163, 184, 0.8)',
    marginBottom: 10,
  },
  sharedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 8,
  },
  menuItem: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    marginBottom: 10,
  },
  menuItemText: {
    color: '#E2E8F0',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  closeMenuItem: {
    paddingVertical: 16,
    marginTop: 10,
  },
  closeMenuText: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  emojiPickerContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  emojiOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedEmoji: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  emojiText: {
    fontSize: 28,
  },
  // Poll Modal Styles
  pollModalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  pollModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 20,
  },
  pollQuestionInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    padding: 16,
    color: '#E2E8F0',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    minHeight: 60,
  },
  pollOptionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(148, 163, 184, 0.8)',
    marginBottom: 10,
    marginLeft: 4,
  },
  pollOptionInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 10,
    padding: 14,
    color: '#E2E8F0',
    fontSize: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  addOptionButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  addOptionText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  pollModalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  pollCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    alignItems: 'center',
  },
  pollCancelText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  pollCreateButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pollCreateGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  pollCreateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Image Viewer Styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  // Gallery Styles
  galleryContainer: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  galleryBackIcon: {
    width: 24,
    height: 24,
    tintColor: '#667eea',
  },
  galleryTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700',
  },
  galleryGrid: {
    padding: 2,
  },
  galleryImage: {
    width: (width - 12) / 3,
    height: (width - 12) / 3,
    margin: 2,
    borderRadius: 4,
  },
  galleryEmptyText: {
    color: 'rgba(148, 163, 184, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 60,
  },
  deleteAllButton: {
    backgroundColor: '#EF4444',
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  trashIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  deleteAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Bulk Delete Modal Styles
  bulkDeleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bulkDeleteCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  bulkDeleteIcon: {
    width: 48,
    height: 48,
    tintColor: '#EF4444',
    marginBottom: 16,
  },
  bulkDeleteTitle: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  bulkDeleteMessage: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  bulkDeleteButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  bulkDeleteCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    alignItems: 'center',
  },
  bulkDeleteCancelText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  bulkDeleteConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  bulkDeleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Edit Option Styles
  editOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  editOptionText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  optionIcon: {
    width: 20,
    height: 20,
    tintColor: '#E2E8F0',
  },
  optionIconDanger: {
    width: 20,
    height: 20,
    tintColor: '#EF4444',
  },
  // Edit Modal Styles
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  editModalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  editModalTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  editModalInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 14,
    color: '#E2E8F0',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    marginBottom: 16,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    alignItems: 'center',
  },
  editCancelText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  editSaveBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  editSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Add Members Modal Styles
  addMembersOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  addMembersContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  addMembersTitle: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  addMembersSubtitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  noFriendsText: {
    color: 'rgba(148, 163, 184, 0.6)',
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 40,
  },
  membersList: {
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  memberItemSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  memberName: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  memberCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCheckboxSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  addMembersButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addMembersCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    alignItems: 'center',
  },
  addMembersCancelText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  addMembersConfirmBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addMembersConfirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  addMembersConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default Chat;
