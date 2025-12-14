/**
 * StoryService - Firebase operations for stories (2-minute expiry for testing)
 */
import { ref, push, set, onValue, remove, get, update } from 'firebase/database';
import { firebaseDatabase } from '../config';

// 2 minutes for testing (change to 24 * 60 * 60 * 1000 for production)
const STORY_EXPIRY_MS = 2 * 60 * 1000;

class StoryService {
    /**
     * Add a new story
     */
    static async addStory(userId, mediaUrl, type = 'image') {
        if (!firebaseDatabase) return null;

        const storiesRef = ref(firebaseDatabase, `stories/${userId}`);
        const newStoryRef = push(storiesRef);

        const story = {
            id: newStoryRef.key,
            userId,
            mediaUrl,
            type,
            timestamp: Date.now(),
            viewers: [],
        };

        await set(newStoryRef, story);
        return story;
    }

    /**
     * Get active stories for a user (not expired)
     */
    static async getActiveStories(userId) {
        if (!firebaseDatabase) return [];

        const storiesRef = ref(firebaseDatabase, `stories/${userId}`);
        const snapshot = await get(storiesRef);
        const data = snapshot.val();

        if (!data) return [];

        const now = Date.now();
        const activeStories = Object.values(data).filter(
            (story) => now - story.timestamp < STORY_EXPIRY_MS
        );

        return activeStories.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Subscribe to all stories (for contacts)
     */
    static subscribeToAllStories(contactIds, callback) {
        if (!firebaseDatabase) return () => { };

        const storiesRef = ref(firebaseDatabase, 'stories');

        return onValue(storiesRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback([]);
                return;
            }

            const now = Date.now();
            const allStories = [];

            Object.entries(data).forEach(([userId, userStories]) => {
                if (!contactIds.includes(userId)) return;

                const activeStories = Object.values(userStories).filter(
                    (story) => now - story.timestamp < STORY_EXPIRY_MS
                );

                if (activeStories.length > 0) {
                    allStories.push({
                        userId,
                        stories: activeStories.sort((a, b) => a.timestamp - b.timestamp),
                        latestTimestamp: Math.max(...activeStories.map(s => s.timestamp)),
                    });
                }
            });

            // Sort by latest story
            allStories.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
            callback(allStories);
        });
    }

    /**
     * Mark story as viewed
     */
    static async markAsViewed(storyOwnerId, storyId, viewerId) {
        if (!firebaseDatabase) return;

        const viewersRef = ref(firebaseDatabase, `stories/${storyOwnerId}/${storyId}/viewers`);
        const snapshot = await get(viewersRef);
        const viewers = snapshot.val() || [];

        if (!viewers.includes(viewerId)) {
            viewers.push(viewerId);
            await set(viewersRef, viewers);
        }
    }

    /**
     * Delete a story
     */
    static async deleteStory(userId, storyId) {
        if (!firebaseDatabase) return;

        const storyRef = ref(firebaseDatabase, `stories/${userId}/${storyId}`);
        await remove(storyRef);
    }

    /**
     * Clean expired stories (call periodically)
     */
    static async cleanExpiredStories(userId) {
        if (!firebaseDatabase) return;

        const storiesRef = ref(firebaseDatabase, `stories/${userId}`);
        const snapshot = await get(storiesRef);
        const data = snapshot.val();

        if (!data) return;

        const now = Date.now();
        const expiredIds = Object.entries(data)
            .filter(([_, story]) => now - story.timestamp >= STORY_EXPIRY_MS)
            .map(([id]) => id);

        for (const storyId of expiredIds) {
            await remove(ref(firebaseDatabase, `stories/${userId}/${storyId}`));
        }
    }

    /**
     * Check if user has unseen stories
     */
    static hasUnseenStories(stories, viewerId) {
        return stories.some((story) => !story.viewers?.includes(viewerId));
    }
}

export default StoryService;
