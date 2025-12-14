import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@theme_preference';

// Theme colors
export const lightTheme = {
    mode: 'light',
    colors: {
        background: '#F8FAFC',
        gradientStart: '#F1F5F9',
        gradientMiddle: '#E2E8F0',
        gradientEnd: '#CBD5E1',
        card: '#FFFFFF',
        cardBorder: 'rgba(100, 116, 139, 0.2)',
        text: '#1E293B',
        textSecondary: 'rgba(30, 41, 59, 0.7)',
        accent: '#667eea',
        accentSecondary: '#764ba2',
        success: '#22C55E',
        error: '#EF4444',
        inputBackground: 'rgba(241, 245, 249, 0.9)',
        inputBorder: 'rgba(100, 116, 139, 0.3)',
        statusBar: 'dark-content',
    },
};

export const darkTheme = {
    mode: 'dark',
    colors: {
        background: '#0A192F',
        gradientStart: '#0A192F',
        gradientMiddle: '#0F172A',
        gradientEnd: '#1E293B',
        card: 'rgba(30, 41, 59, 0.6)',
        cardBorder: 'rgba(100, 116, 139, 0.2)',
        text: '#E2E8F0',
        textSecondary: 'rgba(148, 163, 184, 0.8)',
        accent: '#667eea',
        accentSecondary: '#764ba2',
        success: '#22C55E',
        error: '#EF4444',
        inputBackground: 'rgba(10, 25, 47, 0.95)',
        inputBorder: 'rgba(100, 116, 139, 0.3)',
        statusBar: 'light-content',
    },
};

const ThemeContext = createContext({
    theme: darkTheme,
    isDarkMode: true,
    toggleTheme: () => { },
});

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const theme = isDarkMode ? darkTheme : lightTheme;

    // Load saved theme preference
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme !== null) {
                    setIsDarkMode(savedTheme === 'dark');
                }
            } catch (error) {
                console.error('Error loading theme:', error);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        try {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
