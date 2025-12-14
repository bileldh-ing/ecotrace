/**
 * ChatService - Firebase Realtime Database operations for chat
 */
import { ref, push, set, update, onValue, remove, get } from 'firebase/database';
import { firebaseDatabase } from '../config';

class ChatService {
    /**
     * Generate unique chat ID for two users
     */
    static getChatId(userId1, userId2) {
        return userId1 > userId2 ? userId1 + userId2 : userId2 + userId1;
    }

    /**
     * Send a text message
     */
    static async sendMessage(chatId, senderId, receiverId, text, imageUrl = null, voiceUrl = null, replyTo = null) {
        if (!firebaseDatabase) return null;

        const messagesRef = ref(firebaseDatabase, `chats/${chatId}/messages`);
        const newMessageRef = push(messagesRef);

        const message = {
            id: newMessageRef.key,
            sender: senderId,
            receiver: receiverId,
            text: text || '',
            imageUrl: imageUrl,
            voiceUrl: voiceUrl,
            replyTo: replyTo,
            timestamp: Date.now(),
            deletedFor: [],
        };

        await set(newMessageRef, message);
        return message;
    }

    /**
     * Listen to messages in a chat
     */
    static subscribeToMessages(chatId, callback) {
        if (!firebaseDatabase) return () => { };

        const messagesRef = ref(firebaseDatabase, `chats/${chatId}/messages`);
        return onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const messages = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
                callback(messages);
            } else {
                callback([]);
            }
        });
    }

    /**
     * Update typing status
     */
    static async setTypingStatus(chatId, userId, isTyping) {
        if (!firebaseDatabase) return;

        const typingRef = ref(firebaseDatabase, `chats/${chatId}/typing/${userId}`);
        await set(typingRef, isTyping);
    }

    /**
     * Alias for setTypingStatus
     */
    static async setTyping(chatId, userId, isTyping) {
        return this.setTypingStatus(chatId, userId, isTyping);
    }

    /**
     * Listen to typing status
     */
    static subscribeToTyping(chatId, currentUserId, callback) {
        if (!firebaseDatabase) return () => { };

        const typingRef = ref(firebaseDatabase, `chats/${chatId}/typing`);
        return onValue(typingRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const typingUsers = Object.entries(data)
                    .filter(([uid, isTyping]) => isTyping && uid !== currentUserId)
                    .map(([uid]) => uid);
                callback(typingUsers);
            } else {
                callback([]);
            }
        });
    }

    /**
     * Update read receipt
     */
    static async updateReadReceipt(chatId, userId, lastSeenMessageId) {
        if (!firebaseDatabase) return;

        const receiptRef = ref(firebaseDatabase, `chats/${chatId}/readReceipts/${userId}`);
        await set(receiptRef, {
            lastSeenMessageId,
            timestamp: Date.now(),
        });
    }

    /**
     * Listen to read receipts
     */
    static subscribeToReadReceipts(chatId, callback) {
        if (!firebaseDatabase) return () => { };

        const receiptsRef = ref(firebaseDatabase, `chats/${chatId}/readReceipts`);
        return onValue(receiptsRef, (snapshot) => {
            const data = snapshot.val();
            callback(data || {});
        });
    }

    /**
     * Delete message for user (soft delete)
     */
    static async deleteMessageForMe(chatId, messageId, userId) {
        if (!firebaseDatabase) return;

        const messageRef = ref(firebaseDatabase, `chats/${chatId}/messages/${messageId}`);
        const snapshot = await get(messageRef);
        const message = snapshot.val();

        if (message) {
            const deletedFor = message.deletedFor || [];
            if (!deletedFor.includes(userId)) {
                deletedFor.push(userId);
                await update(messageRef, { deletedFor });
            }
        }
    }

    /**
     * Delete message for everyone (hard delete)
     */
    static async deleteMessageForEveryone(chatId, messageId) {
        if (!firebaseDatabase) return;

        const messageRef = ref(firebaseDatabase, `chats/${chatId}/messages/${messageId}`);
        await remove(messageRef);
    }
}

export default ChatService;
