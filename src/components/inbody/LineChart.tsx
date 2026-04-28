import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '../../theme/colors';
import type { SeriesPoint } from '../../lib/inbody';

interface Props {
  data: SeriesPoint[];
  width: number;
  height: number;
  color?: string;
  unit?: string;
}

const PADDING = { left: 36, right: 16, top: 12, bottom: 22 };

export function LineChart({
  data,
  width,
  height,
  color = colors.mint,
  unit = '',
}: Props) {
  if (data.length === 0) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>기록을 추가해보세요</Text>
      </View>
    );
  }

  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;

  const values = data.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = maxV - minV;
  const yMin = span === 0 ? minV - 1 : minV - span * 0.1;
  const yMax = span === 0 ? maxV + 1 : maxV + span * 0.1;
  const yRange = yMax - yMin;

  const tsList = data.map((p) => p.ts);
  const minT = Math.min(...tsList);
  const maxT = Math.max(...tsList);
  const tRange = maxT - minT || 1;

  const xFor = (ts: number): number =>
    PADDING.left + (data.length === 1 ? innerW / 2 : ((ts - minT) / tRange) * innerW);
  const yFor = (v: number): number =>
    PADDING.top + innerH - ((v - yMin) / yRange) * innerH;

  let path = '';
  data.forEach((p, i) => {
    const x = xFor(p.ts);
    const y = yFor(p.value);
    path += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  });

  const yTicks = [yMax, (yMax + yMin) / 2, yMin];

  return (
    <View>
      <Svg width={width} height={height}>
        {yTicks.map((t, i) => {
          const y = yFor(t);
          return (
            <React.Fragment key={i}>
              <Line
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={y}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <SvgText
                x={PADDING.left - 6}
                y={y + 4}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor="end"
              >
                {t.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Path d={path} stroke={color} strokeWidth={2} fill="none" />
        {data.map((p, i) => (
          <Circle
            key={i}
            cx={xFor(p.ts)}
            cy={yFor(p.value)}
            r={3}
            fill={color}
          />
        ))}
        {data.length > 0 && (
          <>
            <SvgText
              x={xFor(data[0]!.ts)}
              y={height - 6}
              fontSize={10}
              fill={colors.textMuted}
              textAnchor="start"
            >
              {formatShortDate(data[0]!.ts)}
            </SvgText>
            {data.length > 1 && (
              <SvgText
                x={xFor(data[data.length - 1]!.ts)}
                y={height - 6}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor="end"
              >
                {formatShortDate(data[data.length - 1]!.ts)}
              </SvgText>
            )}
          </>
        )}
      </Svg>
      {unit !== '' && <Text style={styles.unit}>단위: {unit}</Text>}
    </View>
  );
}

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 13,
  },
  unit: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
