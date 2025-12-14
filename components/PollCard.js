import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PollService from '../services/PollService';

const PollCard = ({
    pollId,
    currentUserId,
    onClose,
}) => {
    const [poll, setPoll] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        if (!pollId) return;

        const unsubscribe = PollService.subscribeToPoll(pollId, (pollData) => {
            setPoll(pollData);
            if (pollData) {
                const userVote = PollService.getUserVote(pollData, currentUserId);
                setSelectedOption(userVote);
                setHasVoted(!!userVote);
            }
        });

        return () => unsubscribe();
    }, [pollId, currentUserId]);

    const handleVote = async (optionId) => {
        if (poll?.isEnded) return;

        setSelectedOption(optionId);
        await PollService.vote(pollId, optionId, currentUserId);
    };

    const handleEndPoll = async () => {
        await PollService.endPoll(pollId, currentUserId);
    };

    if (!poll) return null;

    const totalVotes = PollService.getTotalVotes(poll);
    const isCreator = poll.createdBy === currentUserId;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)']}
                style={styles.card}
            >
                {/* Poll Header */}
                <View style={styles.header}>
                    <Image
                        source={require('../assets/poll.png')}
                        style={styles.pollIcon}
                    />
                    <Text style={styles.pollLabel}>
                        {poll.isEnded ? 'POLL ENDED' : 'POLL'}
                    </Text>
                </View>

                {/* Question */}
                <Text style={styles.question}>{poll.question}</Text>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {poll.options.map((option) => {
                        const voteCount = option.votes?.length || 0;
                        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                        const isSelected = selectedOption === option.id;

                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionButton,
                                    isSelected && styles.optionButtonSelected,
                                    poll.isEnded && styles.optionButtonEnded,
                                ]}
                                onPress={() => handleVote(option.id)}
                                disabled={poll.isEnded}
                                activeOpacity={0.7}
                            >
                                {/* Progress Bar Background */}
                                <View style={styles.progressBarContainer}>
                                    <Animated.View
                                        style={[
                                            styles.progressBar,
                                            {
                                                width: `${percentage}%`,
                                                backgroundColor: isSelected
                                                    ? 'rgba(102, 126, 234, 0.4)'
                                                    : 'rgba(100, 116, 139, 0.2)',
                                            },
                                        ]}
                                    />
                                </View>

                                {/* Option Content */}
                                <View style={styles.optionContent}>
                                    <View style={styles.optionLeft}>
                                        <View
                                            style={[
                                                styles.radioCircle,
                                                isSelected && styles.radioCircleSelected,
                                            ]}
                                        >
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                        <Text
                                            style={[
                                                styles.optionText,
                                                isSelected && styles.optionTextSelected,
                                            ]}
                                        >
                                            {option.text}
                                        </Text>
                                    </View>
                                    <View style={styles.optionRight}>
                                        <Text style={styles.voteCount}>{voteCount}</Text>
                                        <Text style={styles.percentage}>
                                            {percentage.toFixed(0)}%
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.totalVotes}>
                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                    </Text>

                    {isCreator && !poll.isEnded && (
                        <TouchableOpacity
                            style={styles.endPollButton}
                            onPress={handleEndPoll}
                        >
                            <Text style={styles.endPollText}>End Poll</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        width: '100%',
        paddingHorizontal: 10,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(100, 116, 139, 0.3)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    pollIcon: {
        width: 18,
        height: 18,
        tintColor: '#667eea',
        marginRight: 8,
    },
    pollLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#667eea',
        letterSpacing: 1,
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E2E8F0',
        marginBottom: 16,
        lineHeight: 22,
    },
    optionsContainer: {
        gap: 8,
    },
    optionButton: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(100, 116, 139, 0.3)',
    },
    optionButtonSelected: {
        borderColor: 'rgba(102, 126, 234, 0.6)',
    },
    optionButtonEnded: {
        opacity: 0.8,
    },
    progressBarContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    progressBar: {
        height: '100%',
        borderRadius: 12,
    },
    optionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: 'rgba(100, 116, 139, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    radioCircleSelected: {
        borderColor: '#667eea',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#667eea',
    },
    optionText: {
        fontSize: 14,
        color: 'rgba(226, 232, 240, 0.9)',
        flex: 1,
    },
    optionTextSelected: {
        color: '#E2E8F0',
        fontWeight: '500',
    },
    optionRight: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    voteCount: {
        fontSize: 12,
        color: 'rgba(148, 163, 184, 0.8)',
        fontWeight: '600',
    },
    percentage: {
        fontSize: 11,
        color: 'rgba(148, 163, 184, 0.6)',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(100, 116, 139, 0.15)',
    },
    totalVotes: {
        fontSize: 12,
        color: 'rgba(148, 163, 184, 0.7)',
    },
    endPollButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    endPollText: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600',
    },
});

export default PollCard;
