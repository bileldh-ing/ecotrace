import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const StoryCircle = ({
    user,
    hasUnseenStory,
    onPress,
    isOwnStory,
    size = 70,
}) => {
    const innerSize = size - 6;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress && onPress(user)}
            activeOpacity={0.8}
        >
            {/* Ring - Gradient if unseen, grey if seen */}
            {hasUnseenStory ? (
                <LinearGradient
                    colors={['#667eea', '#764ba2', '#FFD700']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
                >
                    <View style={[styles.innerRing, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
                        {user?.image ? (
                            <Image
                                source={{ uri: user.image }}
                                style={[styles.avatar, { width: innerSize - 4, height: innerSize - 4, borderRadius: (innerSize - 4) / 2 }]}
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { width: innerSize - 4, height: innerSize - 4, borderRadius: (innerSize - 4) / 2 }]}>
                                <Text style={styles.avatarText}>
                                    {(user?.name || user?.username)?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>
            ) : (
                <View style={[styles.ringGrey, { width: size, height: size, borderRadius: size / 2 }]}>
                    <View style={[styles.innerRing, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
                        {user?.image ? (
                            <Image
                                source={{ uri: user.image }}
                                style={[styles.avatar, { width: innerSize - 4, height: innerSize - 4, borderRadius: (innerSize - 4) / 2 }]}
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { width: innerSize - 4, height: innerSize - 4, borderRadius: (innerSize - 4) / 2 }]}>
                                <Text style={styles.avatarText}>
                                    {(user?.name || user?.username)?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Add Button for Own Story */}
            {isOwnStory && (
                <View style={styles.addButton}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.addButtonGradient}
                    >
                        <Text style={styles.addButtonText}>+</Text>
                    </LinearGradient>
                </View>
            )}

            {/* Username */}
            <Text style={styles.username} numberOfLines={1}>
                {isOwnStory ? 'Your Story' : (user?.name || user?.username)?.split(' ')[0] || 'User'}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginHorizontal: 8,
        width: 80,
    },
    ring: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringGrey: {
        backgroundColor: 'rgba(100, 116, 139, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerRing: {
        backgroundColor: '#0A192F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        resizeMode: 'cover',
    },
    avatarPlaceholder: {
        backgroundColor: 'rgba(102, 126, 234, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#667eea',
        fontSize: 22,
        fontWeight: '700',
    },
    addButton: {
        position: 'absolute',
        bottom: 18,
        right: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#0A192F',
        overflow: 'hidden',
    },
    addButtonGradient: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    username: {
        marginTop: 6,
        fontSize: 12,
        color: 'rgba(226, 232, 240, 0.8)',
        fontWeight: '500',
        textAlign: 'center',
    },
});

export default StoryCircle;
