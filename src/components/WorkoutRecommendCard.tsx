import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, spacing } from '../theme/colors';
import type { Readiness } from '../types';
import { recommendWorkout } from '../lib/readiness';

export function WorkoutRecommendCard({
  readiness,
  goal5kSeconds,
  inbodyGoalGap,
}: {
  readiness: Readiness;
  goal5kSeconds?: number | null;
  inbodyGoalGap?: number | null;
}) {
  const rec = recommendWorkout(readiness, { goal5kSeconds, inbodyGoalGap });
  return (
    <Card title="오늘 추천 훈련">
      <View style={styles.row}>
        <View style={styles.dot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{rec.title}</Text>
          <Text style={styles.detail}>{rec.detail}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mint,
    marginTop: 8,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  detail: {
    color: colors.textDim,
    fontSize: 14,
    lineHeight: 20,
  },
});
