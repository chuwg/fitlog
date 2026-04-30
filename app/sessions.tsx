import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SessionListItem,
  type SessionItem,
} from '../src/components/SessionListItem';
import {
  listAllBasketballSessions,
  listAllRunningSessions,
} from '../src/services/db';
import { colors, radius, spacing } from '../src/theme/colors';

type Filter = 'all' | 'running' | 'basketball';

export default function SessionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: Filter }>();
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'all');
  const [items, setItems] = useState<SessionItem[] | null>(null);

  const load = useCallback(async () => {
    const [running, basketball] = await Promise.all([
      listAllRunningSessions(),
      listAllBasketballSessions(),
    ]);
    const merged: SessionItem[] = [
      ...running.map<SessionItem>((r) => ({ type: 'running', data: r })),
      ...basketball.map<SessionItem>((b) => ({ type: 'basketball', data: b })),
    ];
    merged.sort((a, b) => b.data.startedAt - a.data.startedAt);
    setItems(merged);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return null;
    if (filter === 'all') return items;
    return items.filter((x) => x.type === filter);
  }, [items, filter]);

  const onPressItem = (item: SessionItem) => {
    if (item.type === 'running') {
      router.push({
        pathname: '/running-report',
        params: { id: String(item.data.id) },
      });
    } else {
      router.push({
        pathname: '/basketball-report',
        params: { id: String(item.data.id) },
      });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '전체 기록',
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerTintColor: colors.mint,
          headerBackTitle: '닫기',
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.filterRow}>
          {(
            [
              { v: 'all', label: '전체' },
              { v: 'running', label: '러닝' },
              { v: 'basketball', label: '농구' },
            ] as Array<{ v: Filter; label: string }>
          ).map((f) => (
            <Pressable
              key={f.v}
              onPress={() => setFilter(f.v)}
              style={[styles.chip, filter === f.v && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  filter === f.v && styles.chipTextActive,
                ]}
              >
                {f.label}
                {items
                  ? ` ${
                      f.v === 'all'
                        ? items.length
                        : items.filter((x) => x.type === f.v).length
                    }`
                  : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        {filtered === null ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.mint} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>아직 기록이 없어요</Text>
            <Text style={styles.emptyHint}>
              운동 탭에서 첫 세션을 시작해보세요.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {filtered.map((item, i) => (
              <SessionListItem
                key={`${item.type}-${item.data.id}-${i}`}
                item={item}
                onPress={() => onPressItem(item)}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mint + '22',
  },
  chipText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.mint,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyHint: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});

export const _radius = radius;
