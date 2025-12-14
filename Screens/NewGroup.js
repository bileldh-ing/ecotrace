import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { firebaseDatabase } from '../config';
import { ref, onValue, push, set } from 'firebase/database';
import MediaService from '../services/MediaService';

const NewGroup = ({ navigation }) => {
    const [contacts, setContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [groupIcon, setGroupIcon] = useState(null);
    const [groupIconBase64, setGroupIconBase64] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: select contacts, 2: group details

    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser || !firebaseDatabase) {
            setContacts([]);
            return;
        }

        // Load friends first (connected users)
        const friendsRef = ref(firebaseDatabase, `friends/${currentUser.uid}`);
        const unsubFriends = onValue(friendsRef, async (snapshot) => {
            const friendsData = snapshot.val();
            if (friendsData) {
                const friendIds = Object.keys(friendsData);
                const friendsList = [];

                for (const friendId of friendIds) {
                    const userRef = ref(firebaseDatabase, `users/${friendId}`);
                    const userSnapshot = await new Promise((resolve) => {
                        onValue(userRef, resolve, { onlyOnce: true });
                    });
                    const userData = userSnapshot.val();
                    if (userData) {
                        friendsList.push({
                            id: friendId,
                            name: userData.name || userData.username || userData.pseudo,
                            email: userData.email,
                            image: userData.image,
                        });
                    }
                }
                setContacts(friendsList);
            } else {
                // Fallback: load all users if no friends
                const usersRef = ref(firebaseDatabase, 'users');
                onValue(usersRef, (usersSnapshot) => {
                    const usersData = usersSnapshot.val();
                    if (usersData) {
                        const usersList = Object.entries(usersData)
                            .filter(([key]) => key !== currentUser.uid)
                            .map(([key, value]) => ({
                                id: key,
                                name: value.name || value.username || value.pseudo,
                                email: value.email,
                                image: value.image,
                            }));
                        setContacts(usersList);
                    }
                }, { onlyOnce: true });
            }
        });

        return () => unsubFriends();
    }, [currentUser]);

    const toggleContact = (contact) => {
        if (selectedContacts.find(c => c.id === contact.id)) {
            setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
        } else {
            setSelectedContacts([...selectedContacts, contact]);
        }
    };

    const handlePickIcon = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : 'Images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                setGroupIcon(result.assets[0].uri);
                setGroupIconBase64(result.assets[0].base64);
            }
        } catch (error) {
            console.error('Pick icon error:', error);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        if (selectedContacts.length < 1) {
            Alert.alert('Error', 'Please select at least one contact');
            return;
        }

        setLoading(true);
        try {
            // Create group in Firebase
            const groupsRef = ref(firebaseDatabase, 'groups');
            const newGroupRef = push(groupsRef);
            const groupId = newGroupRef.key;

            let iconUrl = null;
            if (groupIconBase64) {
                iconUrl = await MediaService.uploadGroupIcon(groupIconBase64, groupId);
            }

            const memberIds = [currentUser.uid, ...selectedContacts.map(c => c.id)];

            await set(newGroupRef, {
                id: groupId,
                name: groupName.trim(),
                icon: iconUrl,
                members: memberIds,
                admins: [currentUser.uid],
                createdBy: currentUser.uid,
                createdAt: Date.now(),
            });

            Alert.alert('Success', 'Group created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Create group error:', error);
            Alert.alert('Error', 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderContact = ({ item }) => {
        const isSelected = selectedContacts.find(c => c.id === item.id);

        return (
            <TouchableOpacity
                style={[styles.contactItem, isSelected && styles.contactItemSelected]}
                onPress={() => toggleContact(item)}
                activeOpacity={0.7}
            >
                <View style={styles.contactAvatar}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.avatarImage} />
                    ) : (
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.avatarPlaceholder}
                        >
                            <Text style={styles.avatarText}>
                                {item.name?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </LinearGradient>
                    )}
                </View>
                <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactEmail}>{item.email}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0A192F" />
            <LinearGradient colors={['#0A192F', '#0F172A', '#1E293B']} style={styles.background}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)} style={styles.backButton}>
                        <Image source={require('../assets/left-arrow.png')} style={styles.backIcon} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {step === 1 ? 'New Group' : 'Group Details'}
                    </Text>
                    {step === 1 && selectedContacts.length > 0 && (
                        <TouchableOpacity onPress={() => setStep(2)}>
                            <Text style={styles.nextText}>Next</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {step === 1 ? (
                    <>
                        {/* Selected Contacts Preview */}
                        {selectedContacts.length > 0 && (
                            <View style={styles.selectedPreview}>
                                <FlatList
                                    horizontal
                                    data={selectedContacts}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.selectedChip}
                                            onPress={() => toggleContact(item)}
                                        >
                                            <Text style={styles.selectedChipText}>{item.name?.split(' ')[0]}</Text>
                                            <Text style={styles.selectedChipRemove}>✕</Text>
                                        </TouchableOpacity>
                                    )}
                                    keyExtractor={(item) => item.id}
                                    showsHorizontalScrollIndicator={false}
                                />
                            </View>
                        )}

                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search contacts..."
                                placeholderTextColor="rgba(148, 163, 184, 0.6)"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Contacts List */}
                        <FlatList
                            data={filteredContacts}
                            renderItem={renderContact}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No contacts found</Text>
                            }
                        />
                    </>
                ) : (
                    <View style={styles.detailsContainer}>
                        {/* Group Icon */}
                        <TouchableOpacity style={styles.iconPicker} onPress={handlePickIcon}>
                            {groupIcon ? (
                                <Image source={{ uri: groupIcon }} style={styles.groupIconImage} />
                            ) : (
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.groupIconPlaceholder}
                                >
                                    <Text style={styles.groupIconText}>📷</Text>
                                </LinearGradient>
                            )}
                            <View style={styles.iconEditBadge}>
                                <Text style={styles.iconEditText}>✏️</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Group Name */}
                        <View style={styles.nameInputContainer}>
                            <TextInput
                                style={styles.nameInput}
                                placeholder="Group name"
                                placeholderTextColor="rgba(148, 163, 184, 0.6)"
                                value={groupName}
                                onChangeText={setGroupName}
                                maxLength={30}
                            />
                        </View>

                        {/* Members Preview */}
                        <Text style={styles.membersLabel}>
                            {selectedContacts.length + 1} members
                        </Text>
                        <View style={styles.membersPreview}>
                            {selectedContacts.slice(0, 5).map((contact, index) => (
                                <View key={contact.id} style={[styles.memberBadge, { marginLeft: index > 0 ? -10 : 0 }]}>
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.memberBadgeInner}
                                    >
                                        <Text style={styles.memberBadgeText}>
                                            {contact.name?.charAt(0)?.toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                </View>
                            ))}
                            {selectedContacts.length > 5 && (
                                <View style={[styles.memberBadge, { marginLeft: -10 }]}>
                                    <View style={styles.memberMoreBadge}>
                                        <Text style={styles.memberMoreText}>+{selectedContacts.length - 5}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Create Button */}
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={handleCreateGroup}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={styles.createButtonGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.createButtonText}>Create Group</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0A192F',
        paddingTop: 20,
    },
    background: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(100, 116, 139, 0.2)',
    },
    backButton: {
        padding: 8,
    },
    backIcon: {
        width: 22,
        height: 22,
        tintColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#E2E8F0',
    },
    nextText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
    },
    selectedPreview: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(100, 116, 139, 0.1)',
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    selectedChipText: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: '500',
    },
    selectedChipRemove: {
        color: '#667eea',
        fontSize: 12,
        marginLeft: 6,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInput: {
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#E2E8F0',
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'rgba(100, 116, 139, 0.2)',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
    },
    contactItemSelected: {
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.3)',
    },
    contactAvatar: {
        marginRight: 12,
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E2E8F0',
    },
    contactEmail: {
        fontSize: 13,
        color: 'rgba(148, 163, 184, 0.7)',
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(100, 116, 139, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        color: 'rgba(148, 163, 184, 0.6)',
        fontSize: 15,
        marginTop: 40,
    },
    detailsContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 24,
    },
    iconPicker: {
        marginBottom: 24,
        position: 'relative',
    },
    groupIconImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    groupIconPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupIconText: {
        fontSize: 36,
    },
    iconEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFD700',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#0A192F',
    },
    iconEditText: {
        fontSize: 14,
    },
    nameInputContainer: {
        width: '100%',
        marginBottom: 24,
    },
    nameInput: {
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        color: '#E2E8F0',
        fontSize: 18,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'rgba(100, 116, 139, 0.2)',
    },
    membersLabel: {
        color: 'rgba(148, 163, 184, 0.8)',
        fontSize: 14,
        marginBottom: 12,
    },
    membersPreview: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    memberBadge: {
        borderWidth: 2,
        borderColor: '#0A192F',
        borderRadius: 20,
    },
    memberBadgeInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    memberMoreBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(100, 116, 139, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberMoreText: {
        color: '#E2E8F0',
        fontSize: 12,
        fontWeight: '600',
    },
    createButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    createButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
});

export default NewGroup;
