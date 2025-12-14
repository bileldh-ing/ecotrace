import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import { getItemById } from '../services/ecoService';

const ListingDetail = ({ navigation, route }) => {
  const itemId = route?.params?.itemId;
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);

  const title = useMemo(() => {
    return item?.sub_type || item?.subType || 'Listing';
  }, [item]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!itemId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getItemById(itemId);
        if (mounted) setItem(data);
      } catch (e) {
        console.error('Error loading listing:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [itemId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background_main} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent_gradient_end} />
        </View>
      ) : !item ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Listing not found</Text>
          <Text style={styles.emptySubtitle}>This item may have been removed.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Image
              source={{ uri: item.image_url || 'https://via.placeholder.com/600' }}
              style={styles.image}
            />

            <View style={styles.cardBody}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.meta}>
                {(item.category || 'Electronics')} • {(item.condition || 'GOOD')} • {(item.status || 'active')}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Estimated value</Text>
                <Text style={styles.priceValue}>
                  {Number(item.estimated_value || 0).toFixed(2)} {Colors.currency}
                </Text>
              </View>

              {!!item.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.sectionText}>{item.description}</Text>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>ID</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{itemId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Seller</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{item.seller_id || '-'}</Text>
                </View>
              </View>

              <View style={styles.noticeCard}>
                <LinearGradient
                  colors={['rgba(46, 204, 113, 0.18)', 'rgba(59, 130, 246, 0.10)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.noticeGradient}
                >
                  <Text style={styles.noticeText}>
                    Marketplace actions happen from the Marketplace / Connect screens.
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: Colors.background_card,
  },
  backButton: {
    padding: 6,
    width: 40,
  },
  backText: {
    color: Colors.text_primary,
    fontSize: 22,
  },
  headerTitle: {
    flex: 1,
    color: Colors.text_primary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  headerRight: {
    width: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    color: Colors.text_primary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.text_secondary,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: Colors.background_card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  image: {
    width: '100%',
    height: 260,
    backgroundColor: '#0B0B0B',
  },
  cardBody: {
    padding: 16,
  },
  title: {
    color: Colors.text_primary,
    fontSize: 18,
    fontWeight: '900',
  },
  meta: {
    color: Colors.text_secondary,
    marginTop: 6,
    fontSize: 12,
  },
  priceRow: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: Colors.text_secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  priceValue: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '900',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: Colors.text_primary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionText: {
    color: Colors.text_secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  detailKey: {
    color: Colors.text_secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  detailValue: {
    color: Colors.text_primary,
    fontSize: 12,
    maxWidth: '70%',
  },
  noticeCard: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  noticeGradient: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.22)',
    borderRadius: 12,
  },
  noticeText: {
    color: Colors.text_secondary,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default ListingDetail;
