/**
 * MediaService - Supabase Storage operations for media uploads
 */
import { supabase } from '../config/supabaseClient';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

class MediaService {
    static BUCKET_NAME = 'chat-assets';

    /**
     * Upload image to Supabase
     */
    static async uploadImage(base64, folder = 'chat-images') {
        try {
            const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(fileName);

            return publicUrlData?.publicUrl || null;
        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    }

    /**
     * Upload chat image (alias for uploadImage)
     */
    static async uploadChatImage(base64, chatId) {
        return this.uploadImage(base64, `chat-images/${chatId}`);
    }

    /**
     * Upload chat background
     */
    static async uploadBackground(base64, chatId) {
        const fileName = `chat-backgrounds/bg_${chatId}_${Date.now()}.jpg`;

        try {
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(fileName);

            return publicUrlData?.publicUrl || null;
        } catch (error) {
            console.error('Background upload error:', error);
            throw error;
        }
    }

    /**
     * Upload profile image
     */
    static async uploadProfileImage(base64, userId) {
        const fileName = `profile-images/profile_${userId}_${Date.now()}.jpg`;

        try {
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(fileName);

            return publicUrlData?.publicUrl || null;
        } catch (error) {
            console.error('Profile image upload error:', error);
            throw error;
        }
    }

    /**
     * Upload voice message
     */
    static async uploadVoiceMessage(uri, userId) {
        try {
            console.log('Reading audio file from:', uri);

            // Use string literal 'base64' as FileSystem.EncodingType may be undefined on some platforms
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            console.log('Audio file read, base64 length:', base64?.length);

            const fileName = `voice-messages/voice_${userId}_${Date.now()}.m4a`;

            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, decode(base64), {
                    contentType: 'audio/m4a',
                    upsert: false,
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(fileName);

            console.log('Voice message uploaded:', publicUrlData?.publicUrl);
            return publicUrlData?.publicUrl || null;
        } catch (error) {
            console.error('Voice upload error:', error);
            throw error;
        }
    }

    /**
     * Upload story media
     */
    static async uploadStory(base64, userId, isVideo = false) {
        const ext = isVideo ? 'mp4' : 'jpg';
        const contentType = isVideo ? 'video/mp4' : 'image/jpeg';
        const fileName = `stories/${userId}/${Date.now()}.${ext}`;

        try {
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, decode(base64), {
                    contentType,
                    upsert: false,
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(fileName);

            return publicUrlData?.publicUrl || null;
        } catch (error) {
            console.error('Story upload error:', error);
            throw error;
        }
    }

    /**
     * Upload group icon
     */
    static async uploadGroupIcon(base64, groupId) {
        const fileName = `group-icons/group_${groupId}_${Date.now()}.jpg`;

        try {
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(fileName);

            return publicUrlData?.publicUrl || null;
        } catch (error) {
            console.error('Group icon upload error:', error);
            throw error;
        }
    }
}

export default MediaService;
