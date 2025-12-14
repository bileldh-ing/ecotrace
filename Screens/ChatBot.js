import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleGenAI } from '@google/genai';
import * as Speech from 'expo-speech';

// Your Gemini API Key - Store securely in production
const GEMINI_API_KEY = 'AIzaSyB3Vn3rqx4gGmloef8E1Gp2TWp3EpZEGY0';

// Fallback responses when API fails
const FALLBACK_RESPONSES = {
    greetings: [
        "Hello! 👋 Great to see you! How can I assist you today?",
        "Hi there! 😊 I'm here to help. What's on your mind?",
        "Hey! 🌟 Welcome! What would you like to know?",
        "Greetings! 🙌 I'm your friendly assistant. Ask me anything!",
    ],
    weather: [
        "I can't check the weather directly, but you can use your phone's weather app or check weather.com! ☀️🌧️",
        "For accurate weather info, I recommend checking your local weather app. Hope it's sunny for you! 🌤️",
        "Weather varies by location! Check your device's weather widget for the most accurate forecast. 🌈",
    ],
    time: [
        `The current time depends on your timezone, but your device shows it's ${new Date().toLocaleTimeString()}! ⏰`,
        "Check the top of your phone for the current time! ⌚",
    ],
    howAreYou: [
        "I'm doing great, thanks for asking! 🤖 How about you?",
        "I'm wonderful! Ready to help you with anything! 💪",
        "Feeling fantastic and ready to chat! 😄 What's up?",
    ],
    thanks: [
        "You're welcome! 😊 Happy to help!",
        "Anytime! Don't hesitate to ask if you need anything else! 🙏",
        "My pleasure! That's what I'm here for! ✨",
    ],
    jokes: [
        "Why don't scientists trust atoms? Because they make up everything! 😂",
        "What do you call a fake noodle? An impasta! 🍝😄",
        "Why did the scarecrow win an award? He was outstanding in his field! 🌾😂",
        "What do you call a bear with no teeth? A gummy bear! 🐻😄",
        "Why don't eggs tell jokes? They'd crack each other up! 🥚😂",
    ],
    help: [
        "I can help with various things! Try asking me about:\n• General questions\n• Jokes to brighten your day\n• Simple calculations\n• Fun facts\n• And much more! 🚀",
        "I'm here to assist! I can answer questions, tell jokes, share facts, and have a friendly chat! 💬",
    ],
    goodbye: [
        "Goodbye! 👋 Have an amazing day!",
        "See you later! 🌟 Take care!",
        "Bye! Come back anytime you need help! 😊",
    ],
    name: [
        "I'm your AI Assistant! 🤖 You can call me whatever you like!",
        "I'm a friendly chatbot here to help you! No fancy name, just helpful! 😄",
    ],
    love: [
        "Aww, that's sweet! 💕 I appreciate you too!",
        "Thanks! You're awesome! 🌟",
    ],
    age: [
        "I'm as old as the latest update! Always fresh and ready to help! 🆕",
        "Age is just a number for AI! I'm timeless! ⏳✨",
    ],
    food: [
        "I don't eat, but I hear pizza is always a good choice! 🍕",
        "Food sounds delicious! I recommend trying something new today! 🍜",
    ],
    music: [
        "Music is amazing! What genre do you like? Pop, rock, jazz, classical? 🎵",
        "I can't play music, but I bet your favorite playlist would be great right now! 🎧",
    ],
    sports: [
        "Sports are exciting! Do you have a favorite team? ⚽🏀",
        "Whether it's football, basketball, or tennis - sports bring people together! 🏆",
    ],
    movies: [
        "Movies are great! Action, comedy, drama - what's your favorite genre? 🎬",
        "I love discussing movies! Any recent ones you've watched? 🍿",
    ],
    default: [
        "That's an interesting question! Let me think... 🤔 Could you tell me more?",
        "I'm not 100% sure about that, but I'd love to learn more! What else can you share? 📚",
        "Great question! While I process that, feel free to ask me something else! 💭",
        "Hmm, that's a tricky one! Let's explore this together. What specifically interests you? 🔍",
        "I appreciate your curiosity! Can you give me more context? 🧐",
    ],
};

const getFallbackResponse = (message) => {
    const lowerMsg = message.toLowerCase().trim();

    // Greetings
    if (/^(hi|hello|hey|hola|bonjour|salut|yo|sup|morning|evening|afternoon)/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.greetings[Math.floor(Math.random() * FALLBACK_RESPONSES.greetings.length)];
    }
    // Weather
    if (/weather|rain|sunny|cold|hot|temperature|forecast/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.weather[Math.floor(Math.random() * FALLBACK_RESPONSES.weather.length)];
    }
    // Time
    if (/what time|current time|time is it/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.time[Math.floor(Math.random() * FALLBACK_RESPONSES.time.length)];
    }
    // How are you
    if (/how are you|how's it going|what's up|how do you do|how you doing/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.howAreYou[Math.floor(Math.random() * FALLBACK_RESPONSES.howAreYou.length)];
    }
    // Thanks
    if (/thank|thanks|thx|appreciate|grateful/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.thanks[Math.floor(Math.random() * FALLBACK_RESPONSES.thanks.length)];
    }
    // Jokes
    if (/joke|funny|laugh|humor|make me laugh/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.jokes[Math.floor(Math.random() * FALLBACK_RESPONSES.jokes.length)];
    }
    // Help
    if (/help|what can you do|capabilities|features/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.help[Math.floor(Math.random() * FALLBACK_RESPONSES.help.length)];
    }
    // Goodbye
    if (/bye|goodbye|see you|later|cya|farewell/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.goodbye[Math.floor(Math.random() * FALLBACK_RESPONSES.goodbye.length)];
    }
    // Name
    if (/your name|who are you|what are you/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.name[Math.floor(Math.random() * FALLBACK_RESPONSES.name.length)];
    }
    // Love
    if (/love you|like you|you're awesome|you're great/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.love[Math.floor(Math.random() * FALLBACK_RESPONSES.love.length)];
    }
    // Age
    if (/how old|your age|when were you/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.age[Math.floor(Math.random() * FALLBACK_RESPONSES.age.length)];
    }
    // Food
    if (/food|eat|hungry|lunch|dinner|breakfast|pizza|burger/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.food[Math.floor(Math.random() * FALLBACK_RESPONSES.food.length)];
    }
    // Music
    if (/music|song|sing|playlist|spotify|album/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.music[Math.floor(Math.random() * FALLBACK_RESPONSES.music.length)];
    }
    // Sports
    if (/sport|football|soccer|basketball|tennis|game|match|team/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.sports[Math.floor(Math.random() * FALLBACK_RESPONSES.sports.length)];
    }
    // Movies
    if (/movie|film|cinema|watch|netflix|series|show/.test(lowerMsg)) {
        return FALLBACK_RESPONSES.movies[Math.floor(Math.random() * FALLBACK_RESPONSES.movies.length)];
    }

    // Default fallback
    return FALLBACK_RESPONSES.default[Math.floor(Math.random() * FALLBACK_RESPONSES.default.length)];
};

const ChatBot = ({ navigation }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const flatListRef = useRef(null);

    // Welcome message on mount
    useEffect(() => {
        const welcomeMessage = {
            id: Date.now().toString(),
            text: "Hello! 👋 I'm your AI assistant powered by Gemini. How can I help you today?",
            isBot: true,
            timestamp: Date.now(),
        };
        setMessages([welcomeMessage]);
    }, []);

    const sendMessage = async () => {
        if (!inputText.trim() || loading) return;

        const userInputCopy = inputText.trim();
        const userMessage = {
            id: Date.now().toString(),
            text: userInputCopy,
            isBot: false,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const result = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: userInputCopy,
            });

            const botText = result?.text || result?.output?.text || getFallbackResponse(userInputCopy);

            const botMessage = {
                id: (Date.now() + 1).toString(),
                text: botText,
                isBot: true,
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Gemini error:', error);
            // Use fallback response instead of error message
            const fallbackMessage = {
                id: (Date.now() + 1).toString(),
                text: getFallbackResponse(userInputCopy),
                isBot: true,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, fallbackMessage]);
        } finally {
            setLoading(false);
        }
    };

    const toggleSpeech = (text) => {
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
        } else {
            Speech.speak(text);
            setIsSpeaking(true);
        }
    };

    const clearChat = () => {
        setMessages([{
            id: Date.now().toString(),
            text: "Chat cleared! How can I help you?",
            isBot: true,
            timestamp: Date.now(),
        }]);
        Speech.stop();
        setIsSpeaking(false);
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }) => {
        const isBot = item.isBot;

        return (
            <View style={[styles.messageWrapper, isBot ? styles.botWrapper : styles.userWrapper]}>
                {isBot && (
                    <Image
                        source={require('../assets/chatbot.png')}
                        style={styles.botAvatar}
                    />
                )}
                <View style={styles.bubbleContainer}>
                    {isBot ? (
                        <View style={styles.botBubble}>
                            <Text style={styles.botText}>{item.text}</Text>
                            <View style={styles.timeRow}>
                                <Text style={styles.botTime}>{formatTime(item.timestamp)}</Text>
                                <TouchableOpacity onPress={() => toggleSpeech(item.text)} style={styles.speakButton}>
                                    <Text style={styles.speakIcon}>{isSpeaking ? '🔇' : '🔊'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.userBubble}
                        >
                            <Text style={styles.userText}>{item.text}</Text>
                            <Text style={styles.userTime}>{formatTime(item.timestamp)}</Text>
                        </LinearGradient>
                    )}
                </View>
            </View>
        );
    };

    return (
        <LinearGradient
            colors={['#0A192F', '#0F172A', '#1E293B']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Image
                            source={require('../assets/left-arrow.png')}
                            style={styles.backIcon}
                        />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <Image
                            source={require('../assets/chatbot.png')}
                            style={styles.headerAvatar}
                        />
                        <View>
                            <Text style={styles.headerName}>AI Assistant</Text>
                            <Text style={styles.headerStatus}>Powered by Gemini</Text>
                        </View>
                    </View>

                    <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
                        <Image
                            source={require('../assets/trash.png')}
                            style={styles.clearIcon}
                        />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    style={styles.chatContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    {/* Messages List */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />

                    {/* Typing Indicator */}
                    {loading && (
                        <View style={styles.typingContainer}>
                            <Image source={require('../assets/chatbot.png')} style={styles.typingAvatar} />
                            <View style={styles.typingBubble}>
                                <ActivityIndicator size="small" color="#667eea" />
                                <Text style={styles.typingText}>AI is thinking...</Text>
                            </View>
                        </View>
                    )}

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <LinearGradient
                            colors={['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)']}
                            style={styles.inputWrapper}
                        >
                            <TextInput
                                style={styles.input}
                                placeholder="Ask me anything..."
                                placeholderTextColor="rgba(148, 163, 184, 0.6)"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={2000}
                                editable={!loading}
                                onSubmitEditing={sendMessage}
                            />

                            <TouchableOpacity
                                style={styles.sendButtonWrapper}
                                onPress={sendMessage}
                                disabled={loading || !inputText.trim()}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={inputText.trim() ? ['#667eea', '#764ba2'] : ['#4B5563', '#374151']}
                                    style={styles.sendButton}
                                >
                                    <Image
                                        source={require('../assets/send.png')}
                                        style={styles.sendIcon}
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(100, 116, 139, 0.2)',
    },
    backButton: {
        padding: 8,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#667eea',
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    headerName: {
        color: '#E2E8F0',
        fontSize: 17,
        fontWeight: '600',
    },
    headerStatus: {
        color: '#22C55E',
        fontSize: 12,
        marginTop: 2,
    },
    clearButton: {
        padding: 10,
    },
    clearIcon: {
        width: 22,
        height: 22,
        tintColor: '#EF4444',
    },
    chatContainer: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '85%',
    },
    botWrapper: {
        alignSelf: 'flex-start',
    },
    userWrapper: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginTop: 4,
    },
    bubbleContainer: {
        flex: 1,
    },
    botBubble: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 18,
        borderTopLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(100, 116, 139, 0.2)',
    },
    userBubble: {
        borderRadius: 18,
        borderTopRightRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    botText: {
        color: '#E2E8F0',
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 22,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    botTime: {
        color: 'rgba(148, 163, 184, 0.6)',
        fontSize: 11,
    },
    userTime: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 11,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    speakButton: {
        padding: 4,
    },
    speakIcon: {
        fontSize: 14,
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    typingAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    typingText: {
        color: 'rgba(148, 163, 184, 0.8)',
        fontSize: 13,
        fontStyle: 'italic',
    },
    inputContainer: {
        paddingHorizontal: 12,
        paddingBottom: 16,
        paddingTop: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(100, 116, 139, 0.3)',
    },
    input: {
        flex: 1,
        color: '#E2E8F0',
        fontSize: 16,
        maxHeight: 100,
        paddingVertical: 8,
    },
    sendButtonWrapper: {
        marginLeft: 8,
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        tintColor: '#FFFFFF',
    },
});

export default ChatBot;
