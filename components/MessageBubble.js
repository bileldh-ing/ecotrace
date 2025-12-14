import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated,
    PanResponder,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const SWIPE_THRESHOLD = 50;

const MessageBubble = ({
    message,
    isOwn,
    peerAvatar,
    peerName,
    showReadReceipt,
    seenTimestamp,
    onLongPress,
    onDoubleTap,
    onSwipeReply,
    onImagePress,
    messages,
    isGroupChat,
    senderInfo,
}) => {
    const lastTapRef = useRef(0);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;

    // Voice message player state
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);

    // PanResponder for swipe-to-reply
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
            },
            onPanResponderMove: (_, gestureState) => {
                // Allow swipe in both directions
                const clampedDx = Math.max(-80, Math.min(80, gestureState.dx));
                translateX.setValue(clampedDx);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
                    // Trigger reply
                    onSwipeReply && onSwipeReply(message);
                }
                // Animate back to original position
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            },
        })
    ).current;

    // Format seen time as "Seen X ago"
    const formatSeenTime = (timestamp) => {
        if (!timestamp) return '';
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Seen just now';
        if (minutes < 60) return `Seen ${minutes}m ago`;
        if (hours < 24) return `Seen ${hours}h ago`;
        return `Seen ${days}d ago`;
    };

    // Reset sound when voiceUrl changes (e.g., new message sent)
    useEffect(() => {
        if (sound) {
            sound.unloadAsync();
            setSound(null);
            setIsPlaying(false);
            setPosition(0);
            setDuration(0);
        }
    }, [message.voiceUrl]);

    // Cleanup sound on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const handlePlayVoice = async () => {
        if (!message.voiceUrl) return;

        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
            } else {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: message.voiceUrl },
                    { shouldPlay: true, rate: playbackSpeed },
                    (status) => {
                        if (status.isLoaded) {
                            setDuration(status.durationMillis || 0);
                            setPosition(status.positionMillis || 0);
                            if (status.didJustFinish) {
                                setIsPlaying(false);
                                setPosition(0);
                            }
                        }
                    }
                );
                setSound(newSound);
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Voice playback error:', error);
        }
    };

    const handleSpeedChange = async () => {
        const speeds = [1.0, 1.5, 2.0];
        const currentIndex = speeds.indexOf(playbackSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setPlaybackSpeed(nextSpeed);

        if (sound) {
            await sound.setRateAsync(nextSpeed, true);
        }
    };

    const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePress = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        // Check if this is a location message
        if (message.text && message.text.includes('google.com/maps')) {
            const urlMatch = message.text.match(/https:\/\/www\.google\.com\/maps\?q=[\d\.\-,]+/);
            if (urlMatch) {
                Linking.openURL(urlMatch[0]).catch(err =>
                    console.error('Failed to open maps:', err)
                );
                return;
            }
        }

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            onDoubleTap && onDoubleTap();
        }
        lastTapRef.current = now;
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const repliedMessage = message.replyTo
        ? messages?.find((m) => m.id === message.replyTo)
        : null;

    const reactions = message.reactions ? Object.values(message.reactions) : [];

    // Get avatar and name for group chats
    const displayAvatar = isGroupChat && senderInfo?.image ? senderInfo.image : peerAvatar;
    const displayName = isGroupChat && senderInfo?.name ? senderInfo.name : peerName;

    return (
        <View style={styles.messageWrapper}>
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.container,
                    isOwn ? styles.ownContainer : styles.peerContainer,
                    {
                        transform: [
                            { scale: scaleAnim },
                            { translateX: translateX },
                        ]
                    },
                ]}
            >
                {/* Peer Avatar (for 1-on-1 or group chats) */}
                {!isOwn && (
                    <View style={styles.avatarContainer}>
                        <Image
                            source={displayAvatar ? { uri: displayAvatar } : require('../assets/no-photo.png')}
                            style={styles.avatar}
                        />
                    </View>
                )}

                <TouchableOpacity
                    onLongPress={onLongPress}
                    onPress={handlePress}
                    activeOpacity={0.8}
                    style={styles.bubbleWrapper}
                >
                    {/* Sender Name (Group chats only, for peer messages) */}
                    {isGroupChat && !isOwn && displayName && (
                        <Text style={styles.senderName}>{displayName}</Text>
                    )}

                    {/* Reply Preview */}
                    {repliedMessage && (
                        <View style={[styles.replyPreview, isOwn ? styles.ownReply : styles.peerReply]}>
                            <Text style={styles.replyPreviewText} numberOfLines={1}>
                                {repliedMessage.text || '📷 Image'}
                            </Text>
                        </View>
                    )}

                    {/* Message Bubble */}
                    {isOwn ? (
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.ownBubble}
                        >
                            {message.imageUrl && (
                                <TouchableOpacity
                                    onPress={() => onImagePress && onImagePress(message.imageUrl)}
                                    activeOpacity={0.9}
                                >
                                    <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
                                </TouchableOpacity>
                            )}
                            {message.voiceUrl && (
                                <View style={styles.voicePlayer}>
                                    <TouchableOpacity onPress={handlePlayVoice} style={styles.playButtonCircle}>
                                        <Image
                                            source={isPlaying ? require('../assets/pause.png') : require('../assets/play.png')}
                                            style={styles.playPauseIcon}
                                        />
                                    </TouchableOpacity>
                                    <View style={styles.voiceProgress}>
                                        <View style={[styles.voiceProgressBar, { width: `${duration ? (position / duration) * 100 : 0}%` }]} />
                                    </View>
                                    <Text style={styles.voiceDuration}>{formatDuration(duration - position)}</Text>
                                    <TouchableOpacity onPress={handleSpeedChange} style={styles.speedButton}>
                                        <Text style={styles.speedText}>{playbackSpeed}x</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {message.text && (
                                <Text style={styles.ownText}>{message.text}</Text>
                            )}
                            <View style={styles.timeRow}>
                                {message.edited && <Text style={styles.editedTag}>Edited</Text>}
                                <Text style={styles.ownTime}>{formatTime(message.timestamp)}</Text>
                            </View>
                        </LinearGradient>
                    ) : (
                        <View style={styles.peerBubble}>
                            {message.imageUrl && (
                                <TouchableOpacity
                                    onPress={() => onImagePress && onImagePress(message.imageUrl)}
                                    activeOpacity={0.9}
                                >
                                    <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
                                </TouchableOpacity>
                            )}
                            {message.voiceUrl && (
                                <View style={styles.voicePlayer}>
                                    <TouchableOpacity onPress={handlePlayVoice} style={styles.playButtonCircle}>
                                        <Image
                                            source={isPlaying ? require('../assets/pause.png') : require('../assets/play.png')}
                                            style={styles.playPauseIcon}
                                        />
                                    </TouchableOpacity>
                                    <View style={styles.voiceProgress}>
                                        <View style={[styles.voiceProgressBar, { width: `${duration ? (position / duration) * 100 : 0}%` }]} />
                                    </View>
                                    <Text style={styles.voiceDuration}>{formatDuration(duration - position)}</Text>
                                    <TouchableOpacity onPress={handleSpeedChange} style={styles.speedButton}>
                                        <Text style={styles.speedText}>{playbackSpeed}x</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {message.text && (
                                <Text style={styles.peerText}>{message.text}</Text>
                            )}
                            <View style={styles.timeRow}>
                                {message.edited && <Text style={styles.editedTag}>Edited</Text>}
                                <Text style={styles.peerTime}>{formatTime(message.timestamp)}</Text>
                            </View>
                        </View>
                    )}

                    {/* Reactions */}
                    {reactions.length > 0 && (
                        <View style={[styles.reactionsContainer, isOwn ? styles.ownReactions : styles.peerReactions]}>
                            {reactions.map((reaction, idx) => (
                                <Text key={idx} style={styles.reactionEmoji}>{reaction}</Text>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {/* Read Receipt - Messenger style BELOW message */}
            {showReadReceipt && (
                <View style={[styles.seenContainerBelow, isOwn && styles.seenOwnAlign]}>
                    <Image
                        source={peerAvatar ? { uri: peerAvatar } : require('../assets/no-photo.png')}
                        style={styles.readReceiptSmall}
                    />
                    <Text style={styles.seenText}>{formatSeenTime(seenTimestamp)}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    messageWrapper: {
        marginVertical: 2,
        zIndex: 1,
    },
    container: {
        flexDirection: 'row',
        marginVertical: 4,
        alignItems: 'flex-end',
        zIndex: 2,
    },
    ownContainer: {
        justifyContent: 'flex-end',
    },
    peerContainer: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    bubbleWrapper: {
        maxWidth: '75%',
        flexShrink: 1,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#667eea',
        marginBottom: 4,
        marginLeft: 2,
    },
    replyPreview: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 4,
    },
    ownReply: {
        backgroundColor: 'rgba(102, 126, 234, 0.3)',
        borderLeftWidth: 3,
        borderLeftColor: '#667eea',
    },
    peerReply: {
        backgroundColor: 'rgba(100, 116, 139, 0.3)',
        borderLeftWidth: 3,
        borderLeftColor: '#64748B',
    },
    replyPreviewText: {
        fontSize: 12,
        color: 'rgba(226, 232, 240, 0.7)',
    },
    ownBubble: {
        borderRadius: 20,
        borderBottomRightRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        minWidth: 60,
    },
    peerBubble: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        borderRadius: 20,
        borderBottomLeftRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(100, 116, 139, 0.2)',
        minWidth: 60,
    },
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginBottom: 8,
    },
    ownText: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 20,
    },
    peerText: {
        color: '#E2E8F0',
        fontSize: 15,
        lineHeight: 20,
    },
    ownTime: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 11,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    peerTime: {
        color: 'rgba(148, 163, 184, 0.6)',
        fontSize: 11,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        marginTop: 4,
    },
    editedTag: {
        color: 'rgba(148, 163, 184, 0.5)',
        fontSize: 10,
        fontStyle: 'italic',
    },
    reactionsContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: -10,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: 'rgba(100, 116, 139, 0.2)',
    },
    ownReactions: {
        left: 8,
    },
    peerReactions: {
        right: 8,
    },
    reactionEmoji: {
        fontSize: 14,
        marginHorizontal: 2,
    },
    voicePlayer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        minWidth: 180,
    },
    playButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    playButtonCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    playPauseIcon: {
        width: 16,
        height: 16,
        tintColor: '#FFFFFF',
        resizeMode: 'contain',
    },
    playIcon: {
        fontSize: 16,
    },
    voiceProgress: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    voiceProgressBar: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
    },
    voiceDuration: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: 8,
        minWidth: 35,
    },
    speedButton: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        marginLeft: 6,
    },
    speedText: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    seenContainerBelow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 48,
        marginTop: 2,
    },
    seenOwnAlign: {
        justifyContent: 'flex-end',
    },
    readReceiptSmall: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 4,
    },
    seenText: {
        fontSize: 11,
        color: 'rgba(148, 163, 184, 0.7)',
        fontStyle: 'italic',
    },
});

export default MessageBubble;
