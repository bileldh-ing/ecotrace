import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

const ImpactDashboard = ({ trees = 0, animals = 0, items = 0 }) => {
  const treeAnim = useRef(new Animated.Value(0)).current;
  const animalAnim = useRef(new Animated.Value(0)).current;
  const itemAnim = useRef(new Animated.Value(0)).current;

  const [treeValue, setTreeValue] = useState(0);
  const [animalValue, setAnimalValue] = useState(0);
  const [itemValue, setItemValue] = useState(0);

  useEffect(() => {
    const treeSub = treeAnim.addListener(({ value }) => setTreeValue(value));
    const animalSub = animalAnim.addListener(({ value }) => setAnimalValue(value));
    const itemSub = itemAnim.addListener(({ value }) => setItemValue(value));

    Animated.parallel([
      Animated.timing(treeAnim, {
        toValue: trees,
        duration: 900,
        useNativeDriver: false,
      }),
      Animated.timing(animalAnim, {
        toValue: animals,
        duration: 900,
        useNativeDriver: false,
      }),
      Animated.timing(itemAnim, {
        toValue: items,
        duration: 900,
        useNativeDriver: false,
      }),
    ]).start();

    return () => {
      treeAnim.removeListener(treeSub);
      animalAnim.removeListener(animalSub);
      itemAnim.removeListener(itemSub);
    };
  }, [trees, animals, items]);

  const formatNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.floor(n).toString() : '0';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dashboardTitle}>Impact Summary</Text>

      <View style={styles.countersRow}>
        {/* Trees Counter */}
        <LinearGradient
          colors={['rgba(46, 204, 113, 0.15)', 'rgba(0, 31, 63, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.counter}
        >
          <Text style={styles.counterIcon}>🌳</Text>
          <Text style={styles.counterValue}>{formatNumber(treeValue)}</Text>
          <Text style={styles.counterLabel}>Trees Planted</Text>
        </LinearGradient>

        {/* Animals Counter */}
        <LinearGradient
          colors={['rgba(46, 204, 113, 0.15)', 'rgba(0, 31, 63, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.counter}
        >
          <Text style={styles.counterIcon}>🐾</Text>
          <Text style={styles.counterValue}>{formatNumber(animalValue)}</Text>
          <Text style={styles.counterLabel}>Animals Saved</Text>
        </LinearGradient>

        {/* Items Counter */}
        <LinearGradient
          colors={['rgba(46, 204, 113, 0.15)', 'rgba(0, 31, 63, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.counter}
        >
          <Text style={styles.counterIcon}>♻️</Text>
          <Text style={styles.counterValue}>{formatNumber(itemValue)}</Text>
          <Text style={styles.counterLabel}>Items Recycled</Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text_primary,
    marginBottom: 16,
  },
  countersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  counter: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  counterValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.accent_gradient_end,
    marginBottom: 4,
  },
  counterLabel: {
    fontSize: 11,
    color: Colors.text_secondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ImpactDashboard;
