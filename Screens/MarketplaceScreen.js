import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { getItems, updateItemStatus } from '../services/ecoService';
import Colors from '../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const MarketplaceScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedFilter, setSelectedFilter] = useState('All');
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const isAdmin = currentUser?.email === 'admin@email.com';

  const filters = ['All', 'Electronics', 'Plastics', 'Metal', 'Glass'];

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [selectedFilter, items]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const allItems = await getItems();
      setItems(allItems);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const visibleItems = isAdmin
      ? items
      : items.filter((item) => item.status === 'LISTED' || item.status === 'active');
    if (selectedFilter === 'All') {
      setFilteredItems(visibleItems);
    } else {
      setFilteredItems(
        visibleItems.filter((item) => item.category === selectedFilter)
      );
    }
  };

  const handleApprove = async (item) => {
    try {
      if (!isAdmin) return;
      if (!item?.seller_id) return;

      setLoading(true);

      await updateItemStatus(item.id, 'LISTED');
      await loadItems();
    } catch (error) {
      console.error('Error approving item:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderGridItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => navigation.navigate('ListingDetail', { itemId: item.id })}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/200' }}
        style={styles.gridImage}
      />
      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.sub_type || item.subType || 'Item'}
        </Text>
        <Text style={styles.gridPrice}>
          {Number(item.estimated_value || 0).toFixed(2)} TND
        </Text>
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>{item.condition}</Text>
        </View>

        {isAdmin && item.status === 'SCANNED' && (
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApprove(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('ListingDetail', { itemId: item.id })}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/100' }}
        style={styles.listImage}
      />
      <View style={styles.listContent}>
        <Text style={styles.listTitle}>{item.sub_type || item.subType || 'Item'}</Text>
        <Text style={styles.listCategory}>{item.category}</Text>
        <View style={styles.listBottom}>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{item.condition}</Text>
          </View>
          <Text style={styles.listPrice}>
            {Number(item.estimated_value || 0).toFixed(2)} TND
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={24} color={Colors.text_secondary} />
    </TouchableOpacity>
  );

  const renderFilterChip = (filter) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === filter && styles.filterChipActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedFilter === filter && styles.filterChipTextActive,
        ]}
      >
        {filter}
      </Text>
    </TouchableOpacity>
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <Text style={styles.headerSubtitle}>Browse available items</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          data={filters}
          renderItem={({ item }) => renderFilterChip(item)}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'grid' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('grid')}
        >
          <Icon
            name="view-grid"
            size={20}
            color={viewMode === 'grid' ? Colors.accent_gradient_end : Colors.text_secondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'list' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <Icon
            name="view-list"
            size={20}
            color={viewMode === 'list' ? Colors.accent_gradient_end : Colors.text_secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.itemsList}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
          onRefresh={loadItems}
          refreshing={loading}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon
            name="package-variant-closed"
            size={48}
            color={Colors.text_secondary}
          />
          <Text style={styles.emptyText}>No items available</Text>
          <Text style={styles.emptySubtext}>
            Check back soon for more listings
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background_main,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: Colors.text_primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: Colors.text_secondary,
    fontSize: 12,
    marginTop: 4,
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.background_card,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.2)',
  },
  filterChipActive: {
    backgroundColor: Colors.accent_gradient_end,
    borderColor: Colors.accent_gradient_end,
  },
  filterChipText: {
    color: Colors.text_secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.background_card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  itemsList: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  columnWrapper: {
    gap: 8,
    marginHorizontal: 8,
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background_card,
  },
  gridImage: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.background_card,
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    color: Colors.text_primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  gridPrice: {
    color: Colors.accent_gradient_end,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background_card,
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    paddingRight: 12,
  },
  listImage: {
    width: 100,
    height: 100,
  },
  listContent: {
    flex: 1,
    padding: 12,
  },
  listTitle: {
    color: Colors.text_primary,
    fontSize: 14,
    fontWeight: '600',
  },
  listCategory: {
    color: Colors.text_secondary,
    fontSize: 11,
    marginTop: 2,
  },
  listBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  listPrice: {
    color: Colors.accent_gradient_end,
    fontSize: 13,
    fontWeight: 'bold',
  },
  conditionBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    color: Colors.accent_gradient_end,
    fontSize: 10,
    fontWeight: '600',
  },
  approveButton: {
    marginTop: 10,
    backgroundColor: 'rgba(46, 204, 113, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.45)',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveButtonText: {
    color: Colors.accent_gradient_end,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text_primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: Colors.text_secondary,
    fontSize: 12,
    marginTop: 4,
  },
});

export default MarketplaceScreen;
