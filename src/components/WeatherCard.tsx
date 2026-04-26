import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, spacing } from '../theme/colors';
import type { WeatherInfo } from '../types';
import { airQualityLabel } from '../services/weather';

export function WeatherCard({ weather }: { weather: WeatherInfo }) {
  const air = airQualityLabel(weather.pm25);
  return (
    <Card
      title="날씨"
      right={
        <Text style={styles.loc}>
          {weather.locationName}
          {weather.isDefaultLocation ? ' (기본)' : ''}
        </Text>
      }
    >
      <View style={styles.row}>
        <View>
          <Text style={styles.temp}>{weather.tempC}°</Text>
          <Text style={styles.desc}>{weather.description}</Text>
        </View>
        <View style={styles.metrics}>
          <Metric label="체감" value={`${weather.feelsLikeC}°`} />
          <Metric label="습도" value={`${weather.humidity}%`} />
          <Metric label="바람" value={`${weather.windKmh}km/h`} />
        </View>
      </View>
      <View style={styles.airRow}>
        <View style={[styles.airDot, { backgroundColor: air.color }]} />
        <Text style={styles.airLabel}>대기질 {air.label}</Text>
        {weather.pm25 != null && (
          <Text style={styles.airValue}>· 초미세먼지 {weather.pm25}㎍/㎥</Text>
        )}
      </View>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loc: {
    color: colors.textDim,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  temp: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
  desc: {
    color: colors.textDim,
    fontSize: 14,
    marginTop: 2,
  },
  metrics: {
    gap: spacing.xs,
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    minWidth: 110,
  },
  metricLabel: {
    color: colors.textDim,
    fontSize: 13,
  },
  metricValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  airRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  airDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  airLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  airValue: {
    color: colors.textDim,
    fontSize: 13,
  },
});
