import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { getAuth } from 'firebase/auth';
import Slider from '@react-native-community/slider';
import {
  getUserWallet,
  updateUserWallet,
  getTransactions,
  getEvents,
} from '../services/ecoService';
import Colors from '../constants/Colors';
import ImpactCard from '../components/ImpactCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const WalletScreen = ({ navigation }) => {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saleUserShare, setSaleUserShare] = useState(0.7);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      loadWalletData();
    }
  }, [currentUser]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const wallet = await getUserWallet(currentUser.uid);
      setWalletData(wallet);
      setSaleUserShare(typeof wallet?.sale_user_share === 'number' ? wallet.sale_user_share : 0.7);

      const txns = await getTransactions(currentUser.uid);
      setTransactions(txns.slice(0, 10)); // Last 10 transactions
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `${amount.toFixed(2)} TND`;
  };

  const persistSaleShare = async (share) => {
    try {
      if (!currentUser?.uid) return;
      await updateUserWallet(currentUser.uid, { sale_user_share: share });
      await loadWalletData();
    } catch (error) {
      console.error('Error updating sale split:', error);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'SALE':
        return 'currency-usd';
      case 'DONATION':
        return 'heart';
      case 'EVENT_REWARD':
        return 'star';
      default:
        return 'wallet';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'SALE':
        return Colors.success;
      case 'DONATION':
        return Colors.alert_moderate;
      case 'EVENT_REWARD':
        return Colors.co2_blue;
      default:
        return Colors.text_secondary;
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: getTransactionColor(item.type) + '30' },
          ]}
        >
          <Icon
            name={getTransactionIcon(item.type)}
            size={18}
            color={getTransactionColor(item.type)}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>{item.type}</Text>
          <Text style={styles.transactionDesc}>{item.description}</Text>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          {
            color:
              item.user_credited >= 0 ? Colors.success : Colors.alert_high,
          },
        ]}
      >
        {item.user_credited >= 0 ? '+' : ''}{' '}
        {formatCurrency(item.user_credited)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent_gradient_end} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background_main} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Header */}
        <LinearGradient
          colors={[Colors.accent_gradient_start, Colors.accent_gradient_end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          {(walletData?.wallet_balance || 0) === 0 ? (
            <>
              <LottieView
                source={require('../assets/nodata.json')}
                autoPlay
                loop
                style={styles.emptyAnimationSmall}
              />
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <Text style={styles.balanceAmount}>0.00 {Colors.currency}</Text>
              <Text style={styles.balanceDescription}>
                Start earning by recycling and volunteering!
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(walletData?.wallet_balance || 0)}
              </Text>
              <Text style={styles.balanceDescription}>
                Ready to spend on eco-causes
              </Text>
            </>
          )}
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.donateButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="heart" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Donate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.cashoutButton]}
            onPress={() => {
              // TODO: Implement cash-out flow
            }}
          >
            <Icon name="arrow-right" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Cash Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.splitCard}>
          <Text style={styles.sectionTitle}>Sale Split</Text>
          <Text style={styles.splitSubtitle}>
            Your Wallet: {Math.round(saleUserShare * 100)}% • Nature Fund: {100 - Math.round(saleUserShare * 100)}%
          </Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderEndLabel}>0%</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              minimumTrackTintColor={Colors.accent_gradient_end}
              maximumTrackTintColor={'rgba(255,255,255,0.15)'}
              thumbTintColor={Colors.accent_gradient_end}
              value={saleUserShare}
              onValueChange={setSaleUserShare}
              onSlidingComplete={persistSaleShare}
            />
            <Text style={styles.sliderEndLabel}>100%</Text>
          </View>
        </View>

        {/* Impact Stats */}
        <Text style={styles.sectionTitle}>Your Impact</Text>
        <View style={styles.impactGrid}>
          <ImpactCard
            icon="tree"
            label="Trees Planted"
            value={walletData?.trees_planted || 0}
            color={Colors.tree_green}
          />
          <ImpactCard
            icon="paw"
            label="Animals Saved"
            value={walletData?.animals_saved || 0}
            color={Colors.animal_purple}
          />
          <ImpactCard
            icon="leaf"
            label="CO2 Offset (kg)"
            value={walletData?.co2_offset_kg || 0}
            color={Colors.co2_blue}
          />
        </View>

        {/* Transaction History */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon
                name="wallet-outline"
                size={48}
                color={Colors.text_secondary}
              />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Icon name="information" size={20} color={Colors.accent_gradient_end} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>30% Nature Tax</Text>
              <Text style={styles.infoDesc}>
                30% of every sale automatically supports reforestation and animal welfare
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background_main,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyAnimationSmall: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
  },
  balanceDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  donateButton: {
    backgroundColor: Colors.animal_purple,
  },
  cashoutButton: {
    backgroundColor: Colors.tree_green,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  splitCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  splitSubtitle: {
    color: Colors.text_secondary,
    marginTop: 2,
    marginBottom: 10,
    marginHorizontal: 16,
    fontSize: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  slider: {
    width: '78%',
    height: 36,
  },
  sliderEndLabel: {
    color: Colors.text_secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: Colors.text_primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  impactGrid: {
    marginHorizontal: 8,
    marginBottom: 24,
  },
  transactionsSection: {
    marginHorizontal: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    color: Colors.accent_gradient_end,
    fontSize: 12,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  transactionType: {
    color: Colors.text_primary,
    fontSize: 14,
    fontWeight: '600',
  },
  transactionDesc: {
    color: Colors.text_secondary,
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: Colors.text_secondary,
    fontSize: 14,
    marginTop: 12,
  },
  infoSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  infoCard: {
    backgroundColor: Colors.background_card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.2)',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: Colors.text_primary,
    fontSize: 13,
    fontWeight: '600',
  },
  infoDesc: {
    color: Colors.text_secondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
});

export default WalletScreen;
