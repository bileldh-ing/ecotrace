// AI Vision Service - ML-based classification for EcoTrace
// Uses unsupervised learning for Electronics/Plastics classification
import { AI_CLASSIFICATIONS } from '../constants/MockData';
import { classifyElectronics as mlClassifyElectronics, countBottles as mlCountBottles } from './mlClassifier';

/**
 * Classify an item using ML-based analysis
 * @param {string} imageUri - Local image URI
 * @param {string} imageBase64 - Base64 encoded image (optional)
 * @param {string} category - 'Electronics' or 'Plastics' (optional, auto-detect if not provided)
 * @returns {Promise<Object>} - Classification result
 */
export const classifyItem = async (imageUri, imageBase64 = null, category = null) => {
    try {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Use ML classifier based on category
        if (category === 'Electronics') {
            return await mlClassifyElectronics(imageUri, imageBase64);
        } else if (category === 'Plastics') {
            return await mlCountBottles(imageUri, imageBase64);
        }

        // Auto-detect: default deterministically to electronics classifier
        const result = await mlClassifyElectronics(imageUri, imageBase64);
        console.log('✅ Item classified:', result);
        return result;
    } catch (error) {
        console.error('❌ Error classifying item:', error);
        throw error;
    }
};

/**
 * Classify electronics specifically using ML
 * @param {string} imageUri - Local image URI  
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<Object>} - Electronics classification result
 */
export const classifyElectronics = async (imageUri, imageBase64 = null) => {
    return await mlClassifyElectronics(imageUri, imageBase64);
};

/**
 * Count bottles/plastics using ML
 * @param {string} imageUri - Local image URI
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<Object>} - Bottle count result
 */
export const countBottles = async (imageUri, imageBase64 = null) => {
    return await mlCountBottles(imageUri, imageBase64);
};


/**
 * Mock classification - intelligently selects from predefined categories
 * @returns {Object} - Classification result
 */
const mockClassify = () => {
    // Create a weighted distribution for more realistic classification
    // 60% Electronics, 40% Plastics
    const isElectronics = Math.random() < 0.6;

    if (isElectronics) {
        // Electronics distribution: 20% phones, 15% laptops, 15% tablets, 15% displays, 10% cables, 10% smartwatches, 15% random
        const rand = Math.random();
        let classification;

        if (rand < 0.20) {
            // Smartphones - 20%
            const phones = ['iphone', 'android'];
            classification = AI_CLASSIFICATIONS.electronics[phones[Math.floor(Math.random() * phones.length)]];
        } else if (rand < 0.35) {
            // Laptops - 15%
            classification = AI_CLASSIFICATIONS.electronics.laptop;
        } else if (rand < 0.50) {
            // Tablets - 15%
            classification = AI_CLASSIFICATIONS.electronics.tablet;
        } else if (rand < 0.65) {
            // Displays/TVs - 15%
            classification = AI_CLASSIFICATIONS.electronics.tv;
        } else if (rand < 0.75) {
            // Cables - 10%
            classification = AI_CLASSIFICATIONS.electronics.cable;
        } else if (rand < 0.85) {
            // Smartwatches - 10%
            classification = AI_CLASSIFICATIONS.electronics.smartwatch;
        } else {
            // Random electronics - 15%
            const types = Object.keys(AI_CLASSIFICATIONS.electronics);
            const randomType = types[Math.floor(Math.random() * types.length)];
            classification = AI_CLASSIFICATIONS.electronics[randomType];
        }

        const confidence = randomInRange(
            classification.confidence_range[0],
            classification.confidence_range[1]
        );

        const value = randomInRange(
            classification.value_range[0],
            classification.value_range[1]
        );

        return {
            category: classification.category,
            subType: classification.sub_type,
            confidence: parseFloat(confidence.toFixed(4)),
            estimatedValue: parseFloat(value.toFixed(2)),
            condition: determineCondition(confidence),
            keywords: classification.keywords,
            tips: getRecyclingTips(classification.category, classification.sub_type),
        };
    } else {
        // Plastics distribution: 40% bottles, 30% containers, 30% bags
        const rand = Math.random();
        let classification;

        if (rand < 0.4) {
            classification = AI_CLASSIFICATIONS.plastics.bottle;
        } else if (rand < 0.7) {
            classification = AI_CLASSIFICATIONS.plastics.jug;
        } else {
            classification = AI_CLASSIFICATIONS.plastics.bag;
        }

        const confidence = randomInRange(
            classification.confidence_range[0],
            classification.confidence_range[1]
        );

        const value = randomInRange(
            classification.value_range[0],
            classification.value_range[1]
        );

        // Add quantity for bottles
        let quantity = 1;
        if (classification.sub_type === 'Bottle-PET' && classification.quantity_range) {
            quantity = Math.floor(randomInRange(
                classification.quantity_range[0],
                classification.quantity_range[1]
            ));
        }

        return {
            category: classification.category,
            subType: classification.sub_type,
            confidence: parseFloat(confidence.toFixed(4)),
            estimatedValue: parseFloat((value * quantity).toFixed(2)),
            condition: 'GOOD',
            keywords: classification.keywords,
            unit: classification.unit || 'per unit',
            quantity: quantity,
            tips: getRecyclingTips(classification.category, classification.sub_type),
        };
    }
};

/**
 * Determine condition based on AI confidence
 * @param {number} confidence - AI confidence score
 * @returns {string} - Condition grade
 */
const determineCondition = (confidence) => {
    if (confidence >= 0.93) return 'EXCELLENT';
    if (confidence >= 0.90) return 'GOOD';
    if (confidence >= 0.85) return 'FAIR';
    return 'POOR';
};

/**
 * Get random number in range
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
const randomInRange = (min, max) => {
    return Math.random() * (max - min) + min;
};

/**
 * Get recycling tips based on item type
 * @param {string} category 
 * @param {string} subType 
 * @returns {Array<string>} - Tips array
 */
const getRecyclingTips = (category, subType) => {
    const tips = {
        Electronics: {
            Smartphone: [
                'Remove SIM card and memory card before recycling',
                'Factory reset to erase personal data',
                'Consider donating if still functional',
            ],
            Laptop: [
                'Remove hard drive or SSD and wipe data',
                'Remove battery separately',
                'Valuable metals can be recovered',
            ],
            Tablet: [
                'Factory reset before recycling',
                'Remove protective case',
                'Screen glass can be recycled separately',
            ],
            Display: [
                'Handle with care - contains glass',
                'Remove stand and cables',
                'LED/LCD screens contain recyclable materials',
            ],
        },
        Plastics: {
            'Bottle-PET': [
                'Rinse bottle before recycling',
                'Remove cap (different plastic type)',
                'Crush to save space',
            ],
            'Container-HDPE': [
                'Clean thoroughly before recycling',
                'Caps can be recycled with container',
                'HDPE is highly recyclable',
            ],
            'Bag-LDPE': [
                'Clean and dry bags',
                'Bundle multiple bags together',
                'Some stores have dedicated collection bins',
            ],
        },
    };

    return tips[category]?.[subType] || [
        'Ensure item is clean and dry',
        'Separate different materials',
        'Check local recycling guidelines',
    ];
};

/**
 * FUTURE: Analyze item using Google Gemini Vision API
 * Uncomment and configure when ready for Phase 2
 */
/*
import { GoogleGenerativeAI } from '@google/genai';

const GEMINI_API_KEY = 'your_api_key_here';

export const analyzeWithGemini = async (imageBase64) => {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Analyze this item for recycling purposes. Provide:
1. Item type and brand (if visible)
2. Material category: Choose ONE from: Electronics, Plastics, Metal, Glass, Paper
3. Specific sub-category (e.g., Smartphone, Laptop, PET Bottle, HDPE Container)
4. Condition: Choose ONE from: EXCELLENT, GOOD, FAIR, POOR
5. Estimated resale value in Tunisian Dinars (TND)
6. Recyclable components and materials
7. Recycling tips

Return response as JSON with this exact structure:
{
  "category": "Electronics",
  "subType": "Smartphone",
  "brand": "Apple iPhone",
  "condition": "GOOD",
  "estimatedValue": 150.00,
  "confidence": 0.95,
  "materials": ["aluminum", "glass", "lithium battery"],
  "tips": ["Remove SIM card", "Factory reset", "Backup data"]
}`;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
    ]);
    
    const response = result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid response format from Gemini API');
  } catch (error) {
    console.error('❌ Gemini Vision API error:', error);
    // Fallback to mock classification
    return mockClassify();
  }
};
*/

export default {
    classifyItem,
};
