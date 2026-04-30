import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import {
  SessionListItem,
  type SessionItem,
} from './SessionListItem';
import {
  listAllBasketballSessions,
  listAllRunningSessions,
} from '../services/db';
import { colors, spacing } from '../theme/colors';

interface Props {
  type: 'running' | 'basketball';
  reload: number;
  limit?: number;
}

export function RecentSessionsCard({ type, reload, limit = 5 }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<SessionItem[]>([]);

  const load = useCallback(async () => {
    const list =
      type === 'running'
        ? (await listAllRunningSessions()).map<SessionItem>((r) => ({
            type: 'running',
            data: r,
          }))
        : (await listAllBasketballSessions()).map<SessionItem>((b) => ({
            type: 'basketball',
            data: b,
          }));
    list.sort((a, b) => b.data.startedAt - a.data.startedAt);
    setItems(list.slice(0, limit));
  }, [type, limit]);

  useEffect(() => {
    load();
  }, [load, reload]);

  if (items.length === 0) return null;

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
    <Card
      title="최근 기록"
      right={
        <Pressable
          onPress={() =>
            router.push({ pathname: '/sessions', params: { filter: type } })
          }
        >
          <Text style={styles.allLink}>전체 보기 ›</Text>
        </Pressable>
      }
    >
      <View style={styles.list}>
        {items.map((item, i) => (
          <SessionListItem
            key={`${item.type}-${item.data.id}-${i}`}
            item={item}
            onPress={() => onPressItem(item)}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: -spacing.sm,
  },
  allLink: {
    color: colors.mint,
    fontSize: 12,
    fontWeight: '700',
  },
});
