// Supabase Upload Utility - For image/media storage only
import { supabase } from '../config/supabaseClient';
import { decode } from 'base64-arraybuffer';

/**
 * Upload image to Supabase Storage with automatic fallback
 * @param {string} base64Data - Base64 encoded image
 * @param {string} bucket - Storage bucket name
 * @param {string} filename - File name (should be unique)
 * @param {string} fallbackBucket - Fallback bucket if primary fails
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export const uploadImage = async (base64Data, bucket, filename, fallbackBucket = 'chat-assets') => {
    try {
        console.log(`📤 Uploading to Supabase: ${bucket}/${filename}`);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filename, decode(base64Data), {
                contentType: 'image/jpeg',
                upsert: true, // Overwrite if exists
            });

        if (error) {
            // Check if bucket doesn't exist or any other error occurs - use fallback
            const errorMsg = error.message?.toLowerCase() || '';
            const isBucketNotFound = errorMsg.includes('not found') || 
                                     errorMsg.includes('bucket') || 
                                     error.statusCode === 400 ||
                                     error.statusCode === 404;
            
            if (isBucketNotFound && bucket !== fallbackBucket) {
                console.log(`⚠️ Cannot upload to "${bucket}" bucket, using fallback "${fallbackBucket}"`);
                console.log(`   Error was: ${error.message}`);
                
                const { data: fallbackData, error: fallbackError } = await supabase.storage
                    .from(fallbackBucket)
                    .upload(filename, decode(base64Data), {
                        contentType: 'image/jpeg',
                        upsert: true,
                    });

                if (fallbackError) {
                    console.error('❌ Fallback upload error:', fallbackError);
                    throw fallbackError;
                }

                const { data: publicUrlData } = supabase.storage
                    .from(fallbackBucket)
                    .getPublicUrl(filename);

                console.log('✅ Image uploaded to fallback bucket:', publicUrlData.publicUrl);
                return publicUrlData.publicUrl;
            }

            console.error('❌ Upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filename);

        const publicUrl = publicUrlData.publicUrl;
        console.log('✅ Image uploaded:', publicUrl);

        return publicUrl;
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        throw error;
    }
};

/**
 * Upload recycling item image
 * @param {string} base64Data 
 * @param {string} userId 
 * @returns {Promise<string>} - Public URL with automatic fallback
 */
export const uploadRecyclingImage = async (base64Data, userId) => {
    const filename = `recycling/item_${userId}_${Date.now()}.jpg`;
    return uploadImage(base64Data, 'chat-assets', filename, 'chat-assets');
};

/**
 * Upload event/emergency report image
 * @param {string} base64Data 
 * @param {string} userId 
 * @returns {Promise<string>} - Public URL with automatic fallback
 */
export const uploadEventImage = async (base64Data, userId) => {
    const filename = `events/event_${userId}_${Date.now()}.jpg`;
    return uploadImage(base64Data, 'chat-assets', filename, 'chat-assets');
};

/**
 * Upload animal photo
 * @param {string} base64Data 
 * @param {string} animalId 
 * @returns {Promise<string>} - Public URL with automatic fallback
 */
export const uploadAnimalPhoto = async (base64Data, animalId) => {
    const filename = `animals/animal_${animalId}_${Date.now()}.jpg`;
    return uploadImage(base64Data, 'chat-assets', filename, 'chat-assets');
};

/**
 * Upload campaign cover image
 * @param {string} base64Data 
 * @param {string} campaignId 
 * @returns {Promise<string>} - Public URL with automatic fallback
 */
export const uploadCampaignImage = async (base64Data, campaignId) => {
    const filename = `campaigns/campaign_${campaignId}_${Date.now()}.jpg`;
    return uploadImage(base64Data, 'chat-assets', filename, 'chat-assets');
};

/**
 * Delete image from Supabase Storage
 * @param {string} bucket 
 * @param {string} filepath 
 */
export const deleteImage = async (bucket, filepath) => {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filepath]);

        if (error) throw error;
        console.log('✅ Image deleted:', filepath);
    } catch (error) {
        console.error('❌ Error deleting image:', error);
        throw error;
    }
};

export default {
    uploadImage,
    uploadRecyclingImage,
    uploadEventImage,
    uploadAnimalPhoto,
    uploadCampaignImage,
    deleteImage,
};
