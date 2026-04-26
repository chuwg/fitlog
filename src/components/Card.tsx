import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

interface Props {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ title, right, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {(title || right) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
