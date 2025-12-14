/**
 * PollService - Firebase Realtime Database operations for polls
 */
import { ref, push, set, update, onValue, get } from 'firebase/database';
import { firebaseDatabase } from '../config';

class PollService {
    /**
     * Create a new poll in a group chat
     */
    static async createPoll(groupId, creatorId, question, options) {
        if (!firebaseDatabase) return null;

        const pollsRef = ref(firebaseDatabase, 'polls');
        const newPollRef = push(pollsRef);
        const pollId = newPollRef.key;

        const poll = {
            id: pollId,
            groupId: groupId,
            question: question,
            options: options.map((text, index) => ({
                id: `option_${index}`,
                text: text,
                votes: [], // Array of user IDs who voted for this option
            })),
            createdBy: creatorId,
            createdAt: Date.now(),
            isEnded: false,
        };

        await set(newPollRef, poll);
        return poll;
    }

    /**
     * Vote on a poll option
     */
    static async vote(pollId, optionId, userId) {
        if (!firebaseDatabase) return;

        const pollRef = ref(firebaseDatabase, `polls/${pollId}`);
        const snapshot = await get(pollRef);
        const poll = snapshot.val();

        if (!poll || poll.isEnded) return;

        // Remove user's vote from all options first (to handle vote changes)
        const updatedOptions = poll.options.map(option => {
            const votes = option.votes || [];
            return {
                ...option,
                votes: votes.filter(v => v !== userId),
            };
        });

        // Add vote to selected option
        const optionIndex = updatedOptions.findIndex(o => o.id === optionId);
        if (optionIndex !== -1) {
            updatedOptions[optionIndex].votes.push(userId);
        }

        await update(pollRef, { options: updatedOptions });
    }

    /**
     * Remove user's vote from poll
     */
    static async removeVote(pollId, userId) {
        if (!firebaseDatabase) return;

        const pollRef = ref(firebaseDatabase, `polls/${pollId}`);
        const snapshot = await get(pollRef);
        const poll = snapshot.val();

        if (!poll || poll.isEnded) return;

        const updatedOptions = poll.options.map(option => {
            const votes = option.votes || [];
            return {
                ...option,
                votes: votes.filter(v => v !== userId),
            };
        });

        await update(pollRef, { options: updatedOptions });
    }

    /**
     * End a poll (only creator can do this)
     */
    static async endPoll(pollId, userId) {
        if (!firebaseDatabase) return;

        const pollRef = ref(firebaseDatabase, `polls/${pollId}`);
        const snapshot = await get(pollRef);
        const poll = snapshot.val();

        if (!poll || poll.createdBy !== userId) return;

        await update(pollRef, { isEnded: true, endedAt: Date.now() });
    }

    /**
     * Subscribe to poll updates (real-time)
     */
    static subscribeToPoll(pollId, callback) {
        if (!firebaseDatabase) return () => { };

        const pollRef = ref(firebaseDatabase, `polls/${pollId}`);
        return onValue(pollRef, (snapshot) => {
            const poll = snapshot.val();
            callback(poll);
        });
    }

    /**
     * Get all polls for a group
     */
    static async getPollsForGroup(groupId) {
        if (!firebaseDatabase) return [];

        const pollsRef = ref(firebaseDatabase, 'polls');
        const snapshot = await get(pollsRef);
        const allPolls = snapshot.val();

        if (!allPolls) return [];

        return Object.values(allPolls).filter(poll => poll.groupId === groupId);
    }

    /**
     * Get a single poll by ID
     */
    static async getPoll(pollId) {
        if (!firebaseDatabase) return null;

        const pollRef = ref(firebaseDatabase, `polls/${pollId}`);
        const snapshot = await get(pollRef);
        return snapshot.val();
    }

    /**
     * Calculate total votes for a poll
     */
    static getTotalVotes(poll) {
        if (!poll || !poll.options) return 0;
        return poll.options.reduce((total, option) => {
            return total + (option.votes?.length || 0);
        }, 0);
    }

    /**
     * Check if user has voted on a poll
     */
    static getUserVote(poll, userId) {
        if (!poll || !poll.options) return null;
        for (const option of poll.options) {
            if (option.votes?.includes(userId)) {
                return option.id;
            }
        }
        return null;
    }
}

export default PollService;
