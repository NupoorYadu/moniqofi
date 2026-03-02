import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, Platform, ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBG } from '../components/GradientBG';
import { GlassCard } from '../components/GlassCard';
import { Colors } from '../theme/colors';
import useNotificationListener from '../hooks/useNotificationListener';
import { formatINR } from '../utils/format';

// ─── Source → colour mapping ──────────────────────────────────────────────────
const SOURCE_COLOR = {
  'Google Pay':  '#4285F4',
  'PhonePe':     '#5F259F',
  'Paytm':       '#00BAF2',
  'SBI':         '#1565C0',
  'HDFC':        '#004C8C',
  'ICICI':       '#E05C00',
  'Axis':        '#97144D',
  'Kotak':       '#C8202F',
  'Amazon Pay':  '#FF9900',
  'BHIM UPI':    '#008080',
  'CRED':        '#1C1C1C',
  'FreeCharge':  '#FF5722',
  'MobiKwik':    '#0033A0',
};

const CAT_ICON = {
  'Food & Dining':   '🍔',
  'Shopping':        '🛍️',
  'Travel':          '✈️',
  'Subscriptions':   '📺',
  'Utilities':       '💡',
  'Health':          '🏥',
  'Housing':         '🏠',
  'Income':          '💰',
  'Other':           '💸',
};

function PermissionGate({ onRequest }) {
  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.permGate}>
      <Text style={styles.permEmoji}>🔔</Text>
      <Text style={styles.permTitle}>Enable Notification Access</Text>
      <Text style={styles.permBody}>
        MoniqoFi reads your bank & UPI app notifications to detect transactions instantly —
        no passwords, no bank login. Works with SBI, HDFC, ICICI, PhonePe, GPay, Paytm & more.
      </Text>
      <Text style={styles.permNote}>
        Read-only · {'\u00A0'}No internet upload of raw notifications · {'\u00A0'}Stored on-device only
      </Text>
      <TouchableOpacity style={styles.permBtn} onPress={onRequest}>
        <LinearGradient colors={['#8B5CF6', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.permBtnGrad}>
          <Text style={styles.permBtnText}>Grant Access</Text>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.permHint}>
        You'll be taken to Android Settings → Notification Access.{'\n'}
        Toggle <Text style={{ fontWeight: '700' }}>MoniqoFi</Text> on, then come back.
      </Text>
    </Animated.View>
  );
}

function TxCard({ item, index }) {
  const isIncome = item.type === 'income';
  const color = SOURCE_COLOR[item.source] || Colors.purple;
  const icon  = CAT_ICON[item.category] || '💸';
  const time  = new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const date  = new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
      <GlassCard style={styles.txCard}>
        <View style={[styles.txIconBox, { backgroundColor: color + '22', borderColor: color + '55' }]}>
          <Text style={styles.txIconEmoji}>{icon}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.txSub} numberOfLines={1}>{item.source} · {item.category}</Text>
          <Text style={styles.txTime}>{date}  {time}</Text>
        </View>
        <View style={styles.txAmtBox}>
          <Text style={[styles.txAmt, { color: isIncome ? Colors.emerald : Colors.red }]}>
            {isIncome ? '+' : '−'}{formatINR(item.amount)}
          </Text>
          <View style={[styles.txBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.txBadgeText, { color }]}>{item.source}</Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export default function LiveFeedScreen() {
  const {
    hasPermission,
    liveTransactions,
    syncedCount,
    isLoading,
    requestPermission,
    flushPending,
    clearLocal,
  } = useNotificationListener();

  const onRefresh = useCallback(() => {
    flushPending();
  }, [flushPending]);

  const handleClear = () => {
    Alert.alert(
      'Clear Feed',
      'Remove all transactions from the live feed? (Already synced transactions are safe.)',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearLocal },
      ]
    );
  };

  if (Platform.OS !== 'android') {
    return (
      <GradientBG>
        <View style={styles.center}>
          <Text style={styles.iosText}>🍎 Notification Listener is Android-only.{'\n'}Use CSV Import on iOS.</Text>
        </View>
      </GradientBG>
    );
  }

  return (
    <GradientBG>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Live Feed</Text>
          <Text style={styles.headerSub}>
            {hasPermission
              ? `${liveTransactions.length} detected · ${syncedCount} synced`
              : 'Notification access needed'}
          </Text>
        </View>
        {hasPermission && liveTransactions.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Permission gate ── */}
      {!hasPermission ? (
        <PermissionGate onRequest={requestPermission} />
      ) : (
        <>
          {/* ── Status bar ── */}
          <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.statusBar}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Listening to all bank & UPI notifications</Text>
            {isLoading && <Text style={styles.syncing}>  syncing…</Text>}
          </Animated.View>

          {/* ── Supported source chips ── */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(300)}
            style={{ maxHeight: 36, marginBottom: 10 }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            >
              {Object.entries(SOURCE_COLOR).map(([name, clr]) => (
                <View key={name} style={[styles.chip, { borderColor: clr + '66', backgroundColor: clr + '18' }]}>
                  <Text style={[styles.chipText, { color: clr }]}>{name}</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ── Transaction list ── */}
          {liveTransactions.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.empty}>
              <Text style={styles.emptyEmoji}>👂</Text>
              <Text style={styles.emptyTitle}>Listening…</Text>
              <Text style={styles.emptyBody}>
                Make a UPI payment or receive money.{'\n'}
                It'll appear here instantly.
              </Text>
            </Animated.View>
          ) : (
            <FlatList
              data={liveTransactions}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => <TxCard item={item} index={index} />}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.purple} />
              }
            />
          )}
        </>
      )}
    </GradientBG>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
  },
  headerTitle:  { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  headerSub:    { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  clearBtn:     { backgroundColor: Colors.redLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 6 },
  clearBtnText: { color: Colors.red, fontSize: 12, fontWeight: '600' },

  statusBar:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8, gap: 8 },
  statusDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.emerald },
  statusText: { fontSize: 11, color: Colors.textMuted },
  syncing:    { fontSize: 11, color: Colors.purple },

  chipsRow: { maxHeight: 36, marginBottom: 10 },
  chip:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 10, fontWeight: '600' },

  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 10 },

  txCard:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  txIconBox:  { width: 42, height: 42, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  txIconEmoji:{ fontSize: 20 },
  txInfo:     { flex: 1 },
  txTitle:    { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  txSub:      { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  txTime:     { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  txAmtBox:   { alignItems: 'flex-end', gap: 4 },
  txAmt:      { fontSize: 16, fontWeight: '700' },
  txBadge:    { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  txBadgeText:{ fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },

  // Permission gate
  permGate:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  permEmoji:     { fontSize: 64, marginBottom: 16 },
  permTitle:     { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  permBody:      { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  permNote:      { fontSize: 10, color: Colors.emerald, textAlign: 'center', marginBottom: 24, lineHeight: 16 },
  permBtn:       { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  permBtnGrad:   { paddingVertical: 16, alignItems: 'center' },
  permBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  permHint:      { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },

  // Empty state
  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyBody:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // iOS fallback
  center:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  iosText:  { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 24 },
});
