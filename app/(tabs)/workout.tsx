import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BasketballStartForm } from '../../src/components/basketball/StartForm';
import { RunningStartForm } from '../../src/components/running/StartForm';
import { colors, radius, spacing } from '../../src/theme/colors';

type Mode = 'running' | 'basketball';

export default function WorkoutScreen() {
  const [mode, setMode] = useState<Mode>('running');
  const [reload, setReload] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setReload((n) => n + 1);
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>운동</Text>

        <View style={styles.segmentRow}>
          <Pressable
            onPress={() => setMode('running')}
            style={[styles.segment, mode === 'running' && styles.segmentActive]}
          >
            <Text style={styles.segmentEmoji}>🏃</Text>
            <Text
              style={[
                styles.segmentText,
                mode === 'running' && styles.segmentTextActive,
              ]}
            >
              러닝
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('basketball')}
            style={[styles.segment, mode === 'basketball' && styles.segmentActive]}
          >
            <Text style={styles.segmentEmoji}>🏀</Text>
            <Text
              style={[
                styles.segmentText,
                mode === 'basketball' && styles.segmentTextActive,
              ]}
            >
              농구
            </Text>
          </Pressable>
        </View>

        {mode === 'running' ? (
          <RunningStartForm reload={reload} />
        ) : (
          <BasketballStartForm reload={reload} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.mint + '22',
  },
  segmentEmoji: {
    fontSize: 18,
  },
  segmentText: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.mint,
  },
});
