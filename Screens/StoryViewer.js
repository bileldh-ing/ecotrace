import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    StatusBar,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import StoryService from '../services/StoryService';

const { width, height } = Dimensions.get('window');

const StoryViewer = ({ route, navigation }) => {
    const { userId, userName } = route.params || {};
    const [stories, setStories] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        loadStories();
    }, [userId]);

    useEffect(() => {
        if (stories.length > 0) {
            startProgress();
            markAsViewed();
        }
    }, [currentIndex, stories]);

    const loadStories = async () => {
        if (!userId) {
            navigation.goBack();
            return;
        }

        const active = await StoryService.getActiveStories(userId);
        if (active.length === 0) {
            navigation.goBack();
            return;
        }

        setStories(active);
        setLoading(false);
    };

    const markAsViewed = async () => {
        if (stories[currentIndex] && currentUser && userId !== currentUser.uid) {
            await StoryService.markAsViewed(userId, stories[currentIndex].id, currentUser.uid);
        }
    };

    const startProgress = () => {
        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 5000, // 5 seconds per story
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                goToNext();
            }
        });
    };

    const goToNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            navigation.goBack();
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handlePress = (e) => {
        const pressX = e.nativeEvent.locationX;
        if (pressX < width / 3) {
            goToPrev();
        } else {
            goToNext();
        }
    };

    if (loading || stories.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    const currentStory = stories[currentIndex];
    const storyDate = new Date(currentStory.timestamp);
    const timeAgo = getTimeAgo(storyDate);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" hidden />
            <TouchableOpacity
                activeOpacity={1}
                style={styles.storyContainer}
                onPress={handlePress}
            >
                {/* Story Image */}
                <Image
                    source={{ uri: currentStory.mediaUrl }}
                    style={styles.storyImage}
                    resizeMode="cover"
                />

                {/* Progress Bars */}
                <View style={styles.progressContainer}>
                    {stories.map((_, index) => (
                        <View key={index} style={styles.progressBarBg}>
                            <Animated.View
                                style={[
                                    styles.progressBar,
                                    {
                                        width: index < currentIndex
                                            ? '100%'
                                            : index === currentIndex
                                                ? progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                })
                                                : '0%',
                                    },
                                ]}
                            />
                        </View>
                    ))}
                </View>

                {/* Header */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'transparent']}
                    style={styles.headerGradient}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                        <View style={styles.userInfo}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {userName?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.userName}>{userName || 'User'}</Text>
                                <Text style={styles.timeAgo}>{timeAgo}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Footer */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)']}
                    style={styles.footerGradient}
                >
                    <View style={styles.footer}>
                        <Text style={styles.viewerCount}>
                            👁 {currentStory.viewers?.length || 0} views
                        </Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    storyContainer: {
        flex: 1,
    },
    storyImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    progressContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingTop: 8,
        gap: 4,
    },
    progressBarBg: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 1,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    closeButton: {
        padding: 8,
        marginRight: 12,
    },
    closeText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    timeAgo: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        marginTop: 2,
    },
    footerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 40,
        paddingHorizontal: 16,
        paddingTop: 40,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    viewerCount: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
    },
});

export default StoryViewer;
