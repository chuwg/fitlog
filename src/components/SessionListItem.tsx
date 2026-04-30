import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { weekdayLabelSunFirst } from '../lib/dates';
import { formatDistance, formatDuration, formatPace } from '../lib/pace';
import { colors, radius, spacing } from '../theme/colors';
import type { BasketballSession, RunningSession } from '../types';

export type SessionItem =
  | { type: 'running'; data: RunningSession }
  | { type: 'basketball'; data: BasketballSession };

function formatDateLine(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${m}.${day} (${weekdayLabelSunFirst(d)})`;
}

export function SessionListItem({
  item,
  onPress,
}: {
  item: SessionItem;
  onPress: () => void;
}) {
  const date = formatDateLine(item.data.startedAt);
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor:
              item.type === 'running' ? colors.mint + '22' : colors.ok + '22',
          },
        ]}
      >
        <Text style={styles.icon}>
          {item.type === 'running' ? '🏃' : '🏀'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.metrics}>{summary(item)}</Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

function summary(item: SessionItem): string {
  if (item.type === 'running') {
    const r = item.data;
    return `${formatDistance(r.distanceM)}km · ${formatDuration(r.durationS)} · ${formatPace(r.avgPaceSPerKm)}/km`;
  }
  const b = item.data;
  return `${formatDuration(b.durationS)} · ${b.quarters.length}쿼터${b.caloriesKcal !== null ? ` · ${b.caloriesKcal}kcal` : ''}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  date: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  metrics: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  chev: {
    color: colors.textMuted,
    fontSize: 22,
  },
});
