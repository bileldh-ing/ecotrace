import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider } from './context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Authentication from './Screens/Authetification';
import Add from './Screens/Add';
import Chat from './Screens/Chat';
import SplashScreen from './Screens/SplashScreen';
import HomeDashboard from './Screens/HomeDashboard';
import IdentifyScreen from './Screens/RecycleFlow/IdentifyScreen';
import ConnectScreen from './Screens/RecycleFlow/ConnectScreen';
import EventFeed from './Screens/VolunteerFlow/EventFeed';
import EventDetail from './Screens/VolunteerFlow/EventDetail';
import ReportEmergency from './Screens/VolunteerFlow/ReportEmergency';
import VolunteerEventsFeed from './Screens/VolunteerEventsFeed';
import WalletScreen from './Screens/WalletScreen';
import MarketplaceScreen from './Screens/MarketplaceScreen';
import CampaignsScreen from './Screens/CampaignsScreen';
import ListingDetail from './Screens/ListingDetail';
import AnimalAdoption from './Screens/AnimalAdoption';
import AnimalDetail from './Screens/AnimalDetail';
import Profil from './Screens/Profil';
import Colors from './constants/Colors';
import { initializeEcoTables } from './utils/initializeEcoData';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator - Main app interface (4 tabs per directive)
const EcoBottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconSource;
          if (route.name === 'HomeDashboard') {
            iconSource = focused ? require('./assets/home_clicked.png') : require('./assets/home.png');
          } else if (route.name === 'RecycleFlow') {
            iconSource = focused ? require('./assets/scan_clicked.png') : require('./assets/scan.png');
          } else if (route.name === 'Marketplace') {
            iconSource = require('./assets/marketplace.png');
          } else if (route.name === 'Profile') {
            iconSource = require('./assets/user.png');
          }
          return (
            <Image
              source={iconSource}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          );
        },
        tabBarActiveTintColor: Colors.accent_gradient_end,
        tabBarInactiveTintColor: Colors.text_secondary,
        tabBarStyle: {
          backgroundColor: Colors.background_card,
          borderTopColor: 'rgba(46, 204, 113, 0.1)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen
        name="HomeDashboard"
        component={HomeDashboard}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="RecycleFlow"
        component={IdentifyScreen}
        options={{
          tabBarLabel: 'Scan',
        }}
      />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          tabBarLabel: 'Market',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profil}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};


export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Initialize eco data on app launch
  useEffect(() => {
    initializeEcoTables()
      .then(() => console.log('✅ Eco data check complete'))
      .catch((err) => console.error('❌ Eco init error:', err));
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider>
      <View style={styles.container}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animationEnabled: true,
            }}
          >
            <Stack.Screen
              name="Authentication"
              component={Authentication}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="Add"
              component={Add}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="EcoApp"
              component={EcoBottomTabNavigator}
              options={{ animation: 'fade' }}
            />
            {/* Modal screens - overlay on top of tabs */}
            <Stack.Group
              screenOptions={{
                presentation: 'modal',
                animationEnabled: true,
              }}
            >
              <Stack.Screen
                name="ListingDetail"
                component={ListingDetail}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="ConnectScreen"
                component={ConnectScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="VolunteerEventsFeed"
                component={VolunteerEventsFeed}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="EventDetail"
                component={EventDetail}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="ReportEmergency"
                component={ReportEmergency}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="AnimalAdoption"
                component={AnimalAdoption}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="AnimalDetail"
                component={AnimalDetail}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="WalletScreen"
                component={WalletScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="CampaignsScreen"
                component={CampaignsScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="Chat"
                component={Chat}
                options={{ animation: 'slide_from_right' }}
              />
            </Stack.Group>
          </Stack.Navigator>
        </NavigationContainer>

        {/* Splash Screen Overlay */}
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background_main,
  },
});
