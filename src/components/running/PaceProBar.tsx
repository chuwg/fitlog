import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';
import { formatPace } from '../../lib/pace';
import type { PaceSegment } from '../../types';

interface Props {
  segments: PaceSegment[];
  progressRatio?: number;
}

export function PaceProBar({ segments, progressRatio }: Props) {
  return (
    <View>
      <View style={styles.bar}>
        {segments.map((seg, i) => {
          const width = (seg.endRatio - seg.startRatio) * 100;
          return (
            <View
              key={seg.index}
              style={[
                styles.segment,
                {
                  flex: width,
                  backgroundColor:
                    i === 0
                      ? colors.sleep + '55'
                      : i === 1
                        ? colors.mint + '55'
                        : i === 2
                          ? colors.ok + '55'
                          : colors.bad + '55',
                },
              ]}
            >
              <Text style={styles.segLabel}>{seg.label}</Text>
              <Text style={styles.segPace}>{formatPace(seg.paceSPerKm)}</Text>
            </View>
          );
        })}
      </View>
      {progressRatio !== undefined && (
        <View
          style={[
            styles.cursor,
            { left: `${Math.max(0, Math.min(1, progressRatio)) * 100}%` },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  segLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  segPace: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  cursor: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 64,
    backgroundColor: colors.text,
    marginLeft: -1,
  },
});

export const _spacing = spacing;
