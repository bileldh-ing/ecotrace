import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import List from './List';
import Groups from './Groups';
import Profil from './Profil';

const Accueil = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('list');

  const renderContent = () => {
    switch (activeTab) {
      case 'list':
        return <List navigation={navigation} />;
      case 'groups':
        return <Groups navigation={navigation} />;
      case 'profile':
        return <Profil navigation={navigation} />;
      default:
        return <List navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" translucent={false} />
      <View style={styles.container}>
        {/* Content Area */}
        <View style={styles.contentArea}>
          {renderContent()}
        </View>

        {/* Bottom Tab Navigation */}
        <LinearGradient
          colors={['rgba(10, 10, 26, 0.95)', 'rgba(15, 23, 42, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.navigationContainer}
        >
          <View style={styles.tabsWrapper}>
            {/* Contacts Tab */}
            <TouchableOpacity
              style={[styles.tab, activeTab === 'list' && styles.activeTab]}
              onPress={() => setActiveTab('list')}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/list.png')}
                style={[
                  styles.tabIcon,
                  activeTab === 'list' && styles.activeTabIcon
                ]}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'list' && styles.activeTabText
                ]}
              >
                Contacts
              </Text>
              {activeTab === 'list' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            {/* Messages Tab */}
            <TouchableOpacity
              style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
              onPress={() => setActiveTab('groups')}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/group.png')}
                style={[
                  styles.tabIcon,
                  activeTab === 'groups' && styles.activeTabIcon
                ]}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'groups' && styles.activeTabText
                ]}
              >
                Messages
              </Text>
              {activeTab === 'groups' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            {/* Profile Tab */}
            <TouchableOpacity
              style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/profile.png')}
                style={[
                  styles.tabIcon,
                  activeTab === 'profile' && styles.activeTabIcon
                ]}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'profile' && styles.activeTabText
                ]}
              >
                Profile
              </Text>
              {activeTab === 'profile' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
    paddingTop: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  contentArea: {
    flex: 1,
    paddingTop: 10,
  },
  navigationContainer: {
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tabsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
  },
  activeTab: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
  },
  tabIcon: {
    width: 24,
    height: 24,
    tintColor: 'rgba(255, 255, 255, 0.6)',
    resizeMode: 'contain',
    marginBottom: 4,
  },
  activeTabIcon: {
    tintColor: '#667eea',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: '700',
  },
  activeIndicator: {
    width: 30,
    height: 2,
    backgroundColor: '#667eea',
    marginTop: 4,
    borderRadius: 1,
  },
});

export default Accueil;
