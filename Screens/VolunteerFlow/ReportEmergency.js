import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import { createEvent } from '../../services/ecoService';
import { uploadEventImage } from '../../utils/uploadToSupabase';
import Colors from '../../constants/Colors';
import Slider from '@react-native-community/slider';

const ReportEmergency = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState(5);
    const [image, setImage] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        getLocation();
    }, []);

    const getLocation = async () => {
        setLocating(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        } catch (error) {
            console.error('Error getting location:', error);
        } finally {
            setLocating(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!title || !description || !image) {
            Alert.alert('Missing Info', 'Please provide a title, description, and photo.');
            return;
        }

        setLoading(true);
        try {
            // 1. Upload Image
            console.log('📤 Uploading emergency image...');
            const imageUrl = await uploadEventImage(image.base64, `emergency_${Date.now()}`);

            // 2. Create Event in Firebase
            const eventData = {
                title,
                description,
                severity_level: Math.round(severity),
                is_emergency: true,
                latitude: location?.coords?.latitude || 0,
                longitude: location?.coords?.longitude || 0,
                status: 'OPEN',
                image_url: imageUrl,
                reporter_id: currentUser.uid,
                participants_count: 0,
                required_participants: 5, // Default for emergencies
                date: new Date().toISOString(),
            };

            await createEvent(eventData);

            Alert.alert(
                'Alert Sent!',
                'Your emergency report has been broadcast to the EcoSynergy network.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error reporting emergency:', error);
            Alert.alert('Error', 'Failed to send report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (val) => {
        if (val < 4) return Colors.success;
        if (val < 7) return Colors.alert_medium;
        return Colors.alert_high;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background_main} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report Emergency</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Warning Banner */}
                <View style={styles.warningBanner}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={styles.warningText}>
                        Use this for illegal dumping, fires, or wildlife emergencies only.
                    </Text>
                </View>

                {/* Title Input */}
                <Text style={styles.label}>Emergency Type</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Illegal Dumping, Forest Fire"
                    placeholderTextColor={Colors.text_muted}
                    value={title}
                    onChangeText={setTitle}
                />

                {/* Severity Slider */}
                <Text style={styles.label}>
                    Severity Level: <Text style={{ color: getSeverityColor(severity) }}>{Math.round(severity)}</Text>
                </Text>
                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Low</Text>
                    <Slider
                        style={{ width: '70%', height: 40 }}
                        minimumValue={1}
                        maximumValue={10}
                        minimumTrackTintColor={getSeverityColor(severity)}
                        maximumTrackTintColor="#FFFFFF"
                        thumbTintColor={getSeverityColor(severity)}
                        value={severity}
                        onValueChange={setSeverity}
                    />
                    <Text style={styles.sliderLabel}>Critical</Text>
                </View>

                {/* Photo Upload */}
                <Text style={styles.label}>Evidence Phase</Text>
                <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Text style={styles.uploadIcon}>📷</Text>
                            <Text style={styles.uploadText}>Tap to add photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Location Status */}
                <View style={styles.locationContainer}>
                    <Text style={styles.locationIcon}>{locating ? '⏳' : location ? '📍' : '❌'}</Text>
                    <Text style={styles.locationText}>
                        {locating ? 'Fetching GPS...' : location ? 'Location Tagged' : 'Location Required'}
                    </Text>
                </View>

                {/* Description */}
                <Text style={styles.label}>Details</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the situation..."
                    placeholderTextColor={Colors.text_muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                {/* Submit Button */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={[Colors.alert_high, '#C0392B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitText}>BROADCAST ALERT 🚨</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background_main,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 24,
        color: Colors.text_primary,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.alert_high,
    },
    content: {
        padding: 20,
    },
    warningBanner: {
        flexDirection: 'row',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(231, 76, 60, 0.3)',
    },
    warningIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    warningText: {
        color: Colors.text_secondary,
        fontSize: 12,
        flex: 1,
        lineHeight: 18,
    },
    label: {
        color: Colors.text_secondary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: Colors.background_card,
        borderRadius: 12,
        padding: 16,
        color: Colors.text_primary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.background_card,
        padding: 12,
        borderRadius: 12,
    },
    sliderLabel: {
        color: Colors.text_secondary,
        fontSize: 12,
        fontWeight: '600',
    },
    imageUpload: {
        height: 200,
        backgroundColor: Colors.background_card,
        borderRadius: 16,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    uploadIcon: {
        fontSize: 40,
        marginBottom: 8,
        opacity: 0.5,
    },
    uploadText: {
        color: Colors.text_secondary,
        fontSize: 14,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        padding: 12,
        borderRadius: 8,
    },
    locationIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    locationText: {
        color: '#3498DB',
        fontSize: 13,
        fontWeight: '600',
    },
    submitButton: {
        marginTop: 32,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: Colors.alert_high,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

export default ReportEmergency;
