import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Image,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { classifyItem } from '../../services/aiVision';
import { createScannedItem } from '../../services/ecoService';
import { uploadRecyclingImage } from '../../utils/uploadToSupabase';
import Colors from '../../constants/Colors';

const IdentifyScreen = ({ navigation, route }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [classificationResult, setClassificationResult] = useState(null);
    const [manualMode, setManualMode] = useState(false);

    // Manual input fields
    const [category, setCategory] = useState(route.params?.category || 'Electronics');
    const [subType, setSubType] = useState('');
    const [condition, setCondition] = useState('GOOD');
    const [description, setDescription] = useState('');

    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!permission?.granted && permission?.canAskAgain) {
            requestPermission();
        }

        if (route.params?.category) {
            setCategory(route.params.category);
        }
    }, [route.params, permission]);

    const takePicture = async () => {
        if (cameraRef) {
            try {
                const photo = await cameraRef.takePictureAsync({
                    quality: 0.8,
                    base64: true,
                });
                console.log('📸 Photo captured');
                setCapturedImage(photo);
                analyzeImage(photo);
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert('Error', 'Failed to capture photo. Please try again.');
            }
        }
    };

    const pickFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled) {
                setCapturedImage(result.assets[0]);
                analyzeImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to select image.');
        }
    };

    const analyzeImage = async (photo) => {
        setAnalyzing(true);
        try {
            // ML-based classification based on category
            console.log(`🔍 Analyzing ${category} item...`);
            const result = await classifyItem(photo.uri, photo.base64, category);
            setClassificationResult(result);

            // Pre-fill manual fields from ML result
            if (result.category) setCategory(result.category);
            if (result.subType) setSubType(result.subType);
            if (result.condition) setCondition(result.condition);

            // For plastics, show bottle count
            if (category === 'Plastics' && result.count) {
                console.log(`🧴 Detected ${result.count} bottles`);
            }

            console.log('✅ ML Classification complete:', result);
        } catch (error) {
            console.error('❌ Classification error:', error);
            Alert.alert('Error', 'Failed to analyze item. Please try manual entry.');
            setManualMode(true);
        } finally {
            setAnalyzing(false);
        }
    };


    const submitItem = async () => {
        if (!capturedImage) {
            Alert.alert('Error', 'Please capture an image first.');
            return;
        }

        if (!subType.trim()) {
            Alert.alert('Error', 'Please provide item type.');
            return;
        }

        setAnalyzing(true);
        try {
            // Upload image to Supabase
            console.log('📤 Uploading image to Supabase...');
            const imageUrl = await uploadRecyclingImage(
                capturedImage.base64,
                currentUser.uid
            );
            console.log('✅ Image uploaded:', imageUrl);

            // Create item in Firebase
            const itemData = {
                category: category,
                subType: subType,
                condition: condition,
                estimatedValue: classificationResult?.estimatedValue || 0,
                confidence: classificationResult?.confidence || 0.85,
                description: description,
            };

            const itemId = await createScannedItem(currentUser.uid, itemData, imageUrl);
            console.log('✅ Item created:', itemId);

            Alert.alert(
                'Success!',
                `Item created successfully!\nEstimated value: ${itemData.estimatedValue.toFixed(2)} TND`,
                [
                    {
                        text: 'View Bids',
                        onPress: () => navigation.navigate('ConnectScreen'),
                    },
                    {
                        text: 'Scan Another',
                        onPress: resetScreen,
                    },
                ]
            );
        } catch (error) {
            console.error('❌ Error submitting item:', error);
            Alert.alert('Error', 'Failed to submit item. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const resetScreen = () => {
        setCapturedImage(null);
        setClassificationResult(null);
        setManualMode(false);
        setDescription('');
        setSubType('');
    };

    if (!permission) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.accent_gradient_end} />
                <Text style={styles.loadingText}>Checking permissions...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>No access to camera</Text>
                <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
                    <Text style={styles.galleryButtonText}>Pick from Gallery</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background_main} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image source={require('../../assets/left-arrow.png')} style={styles.headerIcon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scan Item</Text>
                <TouchableOpacity onPress={() => setManualMode(!manualMode)} style={styles.manualButton}>
                    <Image
                        source={manualMode ? require('../../assets/camera.png') : require('../../assets/edit.png')}
                        style={styles.headerIcon}
                    />
                </TouchableOpacity>
            </View>

            {!capturedImage ? (
                // Camera View
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        ref={(ref) => setCameraRef(ref)}
                    >
                        <View style={styles.cameraOverlay}>
                            <View style={styles.scanFrame} />
                            <Text style={styles.scanInstruction}>
                                Position the item in the frame
                            </Text>
                        </View>
                    </CameraView>

                    <View style={styles.cameraControls}>
                        <TouchableOpacity onPress={pickFromGallery} style={styles.controlButton}>
                            <Image source={require('../../assets/gallery.png')} style={styles.controlButtonIconImage} />
                            <Text style={styles.controlButtonText}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={takePicture}
                            style={styles.captureButton}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[Colors.accent_gradient_start, Colors.accent_gradient_end]}
                                style={styles.captureButtonGradient}
                            >
                                <View style={styles.captureButtonInner} />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={pickFromGallery} style={styles.controlButton}>
                            <Image source={require('../../assets/upload.png')} style={styles.controlButtonIconImage} />
                            <Text style={styles.controlButtonText}>Upload</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                // Review & Edit View
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.reviewContainer}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Image Preview */}
                        <View style={styles.imagePreview}>
                            <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />
                            <TouchableOpacity onPress={resetScreen} style={styles.retakeButton}>
                                <Text style={styles.retakeButtonText}>📷 Retake</Text>
                            </TouchableOpacity>
                        </View>

                        {/* AI Analysis Result */}
                        {analyzing ? (
                            <View style={styles.analyzingCard}>
                                <ActivityIndicator size="large" color={Colors.accent_gradient_end} />
                                <Text style={styles.analyzingText}>Analyzing item with AI...</Text>
                            </View>
                        ) : classificationResult && !manualMode ? (
                            <View style={styles.resultCard}>
                                <LinearGradient
                                    colors={[Colors.accent_gradient_start, Colors.accent_gradient_end]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.confidenceBadge}
                                >
                                    <Text style={styles.confidenceText}>
                                        {(classificationResult.confidence * 100).toFixed(1)}% Confident
                                    </Text>
                                </LinearGradient>

                                <Text style={styles.resultLabel}>Category</Text>
                                <Text style={styles.resultValue}>{classificationResult.category}</Text>

                                <Text style={styles.resultLabel}>Type</Text>
                                <Text style={styles.resultValue}>{classificationResult.subType}</Text>

                                <Text style={styles.resultLabel}>Condition</Text>
                                <Text style={styles.resultValue}>{classificationResult.condition}</Text>

                                <Text style={styles.resultLabel}>Estimated Value</Text>
                                <Text style={styles.estimatedValue}>
                                    {classificationResult.estimatedValue.toFixed(2)} TND
                                </Text>

                                {classificationResult.tips && (
                                    <View style={styles.tipsContainer}>
                                        <Text style={styles.tipsTitle}>💡 Recycling Tips:</Text>
                                        {classificationResult.tips.map((tip, index) => (
                                            <Text key={index} style={styles.tipText}>
                                                • {tip}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ) : null}

                        {/* Manual Entry Form */}
                        {manualMode && (
                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>Manual Entry</Text>

                                <Text style={styles.inputLabel}>Category</Text>
                                <View style={styles.categoryButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.categoryButton,
                                            category === 'Electronics' && styles.categoryButtonActive,
                                        ]}
                                        onPress={() => setCategory('Electronics')}
                                    >
                                        <Text
                                            style={[
                                                styles.categoryButtonText,
                                                category === 'Electronics' && styles.categoryButtonTextActive,
                                            ]}
                                        >
                                            Electronics
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.categoryButton,
                                            category === 'Plastics' && styles.categoryButtonActive,
                                        ]}
                                        onPress={() => setCategory('Plastics')}
                                    >
                                        <Text
                                            style={[
                                                styles.categoryButtonText,
                                                category === 'Plastics' && styles.categoryButtonTextActive,
                                            ]}
                                        >
                                            Plastics
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.inputLabel}>Item Type</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g., iPhone 11, Laptop, Bottle"
                                    placeholderTextColor={Colors.text_muted}
                                    value={subType}
                                    onChangeText={setSubType}
                                />

                                <Text style={styles.inputLabel}>Condition</Text>
                                <View style={styles.conditionButtons}>
                                    {['EXCELLENT', 'GOOD', 'FAIR', 'POOR'].map((cond) => (
                                        <TouchableOpacity
                                            key={cond}
                                            style={[
                                                styles.conditionButton,
                                                condition === cond && styles.conditionButtonActive,
                                            ]}
                                            onPress={() => setCondition(cond)}
                                        >
                                            <Text
                                                style={[
                                                    styles.conditionButtonText,
                                                    condition === cond && styles.conditionButtonTextActive,
                                                ]}
                                            >
                                                {cond}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.inputLabel}>Description (Optional)</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    placeholder="Any additional details..."
                                    placeholderTextColor={Colors.text_muted}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={submitItem}
                            disabled={analyzing}
                        >
                            <LinearGradient
                                colors={[Colors.accent_gradient_start, Colors.accent_gradient_end]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitGradient}
                            >
                                <Text style={styles.submitText}>
                                    {analyzing ? 'Uploading...' : 'List Item for Recycling'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background_main,
    },
    centered: {
        flex: 1,
        backgroundColor: Colors.background_main,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        color: Colors.text_secondary,
        marginTop: 16,
        fontSize: 16,
    },
    errorText: {
        color: Colors.alert_high,
        fontSize: 18,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 28,
        color: Colors.text_primary,
    },
    headerIcon: {
        width: 22,
        height: 22,
        tintColor: Colors.text_primary,
    },
    headerTitle: {
        fontSize: 20,
        color: Colors.text_primary,
        fontWeight: '700',
    },
    manualButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    manualButtonText: {
        fontSize: 24,
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 280,
        height: 280,
        borderWidth: 3,
        borderColor: Colors.accent_gradient_end,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    scanInstruction: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    cameraControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    controlButton: {
        alignItems: 'center',
        width: 80,
    },
    controlButtonIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    controlButtonIconImage: {
        width: 28,
        height: 28,
        marginBottom: 8,
        tintColor: '#FFFFFF',
    },
    controlButtonText: {
        color: Colors.text_secondary,
        fontSize: 12,
        fontWeight: '600',
    },
    captureButton: {
        width: 80,
        height: 80,
    },
    captureButtonGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#FFFFFF',
    },
    reviewContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    imagePreview: {
        position: 'relative',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: 300,
        borderRadius: 16,
    },
    retakeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    retakeButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    analyzingCard: {
        backgroundColor: Colors.background_card,
        margin: 20,
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
    },
    analyzingText: {
        color: Colors.text_secondary,
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    resultCard: {
        backgroundColor: Colors.background_card,
        margin: 20,
        padding: 20,
        borderRadius: 16,
    },
    confidenceBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 16,
    },
    confidenceText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    resultLabel: {
        color: Colors.text_secondary,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 4,
    },
    resultValue: {
        color: Colors.text_primary,
        fontSize: 18,
        fontWeight: '700',
    },
    estimatedValue: {
        color: Colors.success,
        fontSize: 24,
        fontWeight: '700',
        marginTop: 4,
    },
    tipsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    tipsTitle: {
        color: Colors.text_primary,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 8,
    },
    tipText: {
        color: Colors.text_secondary,
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 4,
    },
    formCard: {
        backgroundColor: Colors.background_card,
        margin: 20,
        padding: 20,
        borderRadius: 16,
    },
    formTitle: {
        color: Colors.text_primary,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    inputLabel: {
        color: Colors.text_secondary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    categoryButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    categoryButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    categoryButtonActive: {
        backgroundColor: Colors.accent_gradient_end,
        borderColor: Colors.accent_gradient_end,
    },
    categoryButtonText: {
        color: Colors.text_secondary,
        fontWeight: '600',
        fontSize: 14,
    },
    categoryButtonTextActive: {
        color: '#FFFFFF',
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: Colors.text_primary,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    conditionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    conditionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    conditionButtonActive: {
        backgroundColor: Colors.accent_gradient_start,
        borderColor: Colors.accent_gradient_start,
    },
    conditionButtonText: {
        color: Colors.text_secondary,
        fontSize: 12,
        fontWeight: '600',
    },
    conditionButtonTextActive: {
        color: '#FFFFFF',
    },
    submitButton: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    galleryButton: {
        backgroundColor: Colors.background_card,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    galleryButtonText: {
        color: Colors.text_primary,
        fontWeight: '600',
    },
});

export default IdentifyScreen;
