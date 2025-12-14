import React, { useState, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Text,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

const ChatInput = ({
    value,
    onChangeText,
    onSend,
    onPickImage,
    onTakePhoto,
    onCreatePoll,
    isGroupChat,
    onStartVoice,
    onStopVoice,
    isRecording,
    attachedImage,
    onRemoveImage,
    replyingTo,
    onCancelReply,
    quickEmoji = '👍',
    onQuickEmojiChange,
    disabled,
    onPhoneCall,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [recording, setRecording] = useState(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleSendPress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        if (value.trim() || attachedImage) {
            onSend && onSend();
        } else {
            // Send quick emoji
            onSend && onSend(quickEmoji);
        }
    };

    const handleMicPressIn = async () => {
        console.log('Mic pressed in - starting recording');
        try {
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                console.log('Audio permission not granted');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            if (recording) {
                try {
                    await recording.stopAndUnloadAsync();
                } catch (err) {
                    // Ignore unload error
                }
                setRecording(null);
            }

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            console.log('Recording started successfully');
            setRecording(newRecording);
            onStartVoice && onStartVoice();
        } catch (error) {
            console.error('Start recording error:', error);
        }
    };

    const handleMicPressOut = async () => {
        console.log('Mic released - stopping recording');
        try {
            if (!recording) {
                console.log('No recording to stop');
                onStopVoice && onStopVoice(null);
                return;
            }

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log('Recording stopped, URI:', uri);
            setRecording(null);

            onStopVoice && onStopVoice(uri);
        } catch (error) {
            console.error('Stop recording error:', error);
            setRecording(null);
            onStopVoice && onStopVoice(null);
        }
    };

    return (
        <View style={styles.container}>
            {/* Reply Preview */}
            {replyingTo && (
                <View style={styles.replyContainer}>
                    <View style={styles.replyLine} />
                    <View style={styles.replyContent}>
                        <Text style={styles.replyLabel}>Replying to</Text>
                        <Text style={styles.replyText} numberOfLines={1}>
                            {replyingTo.text || 'Message'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onCancelReply} style={styles.cancelReply}>
                        <Text style={styles.cancelReplyText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Attached Image Preview */}
            {attachedImage && (
                <View style={styles.attachmentContainer}>
                    <Image source={{ uri: attachedImage }} style={styles.attachmentImage} />
                    <TouchableOpacity onPress={onRemoveImage} style={styles.removeAttachment}>
                        <Text style={styles.removeAttachmentText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Voice Recording Indicator */}
            {isRecording && (
                <View style={styles.recordingContainer}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>Recording... Release to send</Text>
                </View>
            )}

            {/* Input Row */}
            <LinearGradient
                colors={['rgba(10, 25, 47, 0.95)', 'rgba(30, 41, 59, 0.9)']}
                style={[styles.inputGradient, isFocused && styles.inputFocused]}
            >
                <View style={styles.inputRow}>
                    {/* Attachment Button (Gallery) */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onPickImage}
                        disabled={disabled}
                    >
                        <Image
                            source={require('../assets/attach.png')}
                            style={styles.attachIcon}
                        />
                    </TouchableOpacity>

                    {/* Camera Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onTakePhoto}
                        disabled={disabled}
                    >
                        <Image
                            source={require('../assets/camera.png')}
                            style={styles.cameraIcon}
                        />
                    </TouchableOpacity>

                    {/* Poll Button (Group chats only) */}
                    {isGroupChat && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onCreatePoll}
                            disabled={disabled}
                        >
                            <Image
                                source={require('../assets/poll.png')}
                                style={styles.pollIcon}
                            />
                        </TouchableOpacity>
                    )}

                    {/* Text Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Message..."
                        placeholderTextColor="rgba(148, 163, 184, 0.6)"
                        value={value}
                        onChangeText={onChangeText}
                        multiline
                        maxLength={1000}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        editable={!disabled && !isRecording}
                    />

                    {/* Microphone Button (when no text) */}
                    {!value.trim() && !attachedImage && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPressIn={handleMicPressIn}
                            onPressOut={handleMicPressOut}
                            disabled={disabled}
                        >
                            <Image
                                source={require('../assets/microphone.png')}
                                style={[styles.micIcon, isRecording && styles.recordingIcon]}
                            />
                        </TouchableOpacity>
                    )}

                    {/* Send / Like Button */}
                    <TouchableOpacity
                        style={styles.sendButtonWrapper}
                        onPress={handleSendPress}
                        onLongPress={!value.trim() && !attachedImage ? onQuickEmojiChange : undefined}
                        disabled={disabled}
                        activeOpacity={0.8}
                    >
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={styles.sendButton}
                            >
                                {value.trim() || attachedImage ? (
                                    <Image
                                        source={require('../assets/send.png')}
                                        style={styles.sendIcon}
                                    />
                                ) : quickEmoji === '👍' ? (
                                    <Image
                                        source={require('../assets/like.png')}
                                        style={styles.likeIcon}
                                    />
                                ) : (
                                    <Text style={styles.quickEmojiText}>{quickEmoji}</Text>
                                )}
                            </LinearGradient>
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingBottom: 16,
        paddingTop: 8,
    },
    replyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#667eea',
    },
    replyLine: {
        width: 3,
        height: '100%',
        backgroundColor: '#667eea',
        borderRadius: 1.5,
        marginRight: 10,
    },
    replyContent: {
        flex: 1,
    },
    replyLabel: {
        fontSize: 11,
        color: '#667eea',
        fontWeight: '600',
        marginBottom: 2,
    },
    replyText: {
        fontSize: 13,
        color: 'rgba(226, 232, 240, 0.8)',
    },
    cancelReply: {
        padding: 6,
    },
    cancelReplyText: {
        color: 'rgba(148, 163, 184, 0.8)',
        fontSize: 16,
        fontWeight: '600',
    },
    attachmentContainer: {
        marginBottom: 8,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    attachmentImage: {
        width: width - 24,
        height: 150,
        borderRadius: 16,
    },
    removeAttachment: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeAttachmentText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    recordingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        marginRight: 10,
    },
    recordingText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '500',
    },
    inputGradient: {
        borderRadius: 25,
        padding: 2,
        borderWidth: 1,
        borderColor: 'rgba(100, 116, 139, 0.2)',
    },
    inputFocused: {
        borderColor: 'rgba(102, 126, 234, 0.5)',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 23,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    actionButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachGradient: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachIcon: {
        width: 22,
        height: 22,
        resizeMode: 'contain',
        tintColor: 'rgba(255, 255, 255, 0.9)',
    },
    cameraIcon: {
        width: 22,
        height: 22,
        resizeMode: 'contain',
        tintColor: '#667eea',
    },
    pollIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        tintColor: '#22C55E',
    },
    micIcon: {
        width: 22,
        height: 22,
        resizeMode: 'contain',
        tintColor: 'rgba(148, 163, 184, 0.8)',
    },
    recordingIcon: {
        tintColor: '#EF4444',
    },
    input: {
        flex: 1,
        color: '#E2E8F0',
        fontSize: 16,
        maxHeight: 100,
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    sendButtonWrapper: {
        marginLeft: 4,
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        tintColor: '#FFFFFF',
    },
    likeIcon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
    quickEmojiText: {
        fontSize: 24,
    },
});

export default ChatInput;
