import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';

interface Props {
  emoji: string;
  title: string;
  subtitle: string;
  note?: string;
}

export function Placeholder({ emoji, title, subtitle, note }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {note && <Text style={styles.note}>{note}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 15,
    textAlign: 'center',
  },
  note: {
    color: colors.mint,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xl,
  },
});
