import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Card } from '../Card';
import { colors, radius, spacing } from '../../theme/colors';
import type { RoutePoint } from '../../types';

interface Props {
  route: RoutePoint[];
  height?: number;
}

export function RouteMap({ route, height = 240 }: Props) {
  if (route.length < 2) {
    return (
      <Card title="경로">
        <Text style={styles.empty}>경로 데이터가 부족합니다.</Text>
      </Card>
    );
  }

  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = Math.max(0.005, (maxLat - minLat) * 1.4);
  const lngDelta = Math.max(0.005, (maxLng - minLng) * 1.4);
  const region = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };

  const coords = route.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const start = coords[0]!;
  const end = coords[coords.length - 1]!;

  return (
    <Card title="경로">
      <View style={[styles.mapWrap, { height }]}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsUserLocation={false}
          showsCompass={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          loadingEnabled
          loadingIndicatorColor={colors.mint}
        >
          <Polyline
            coordinates={coords}
            strokeColor={colors.mint}
            strokeWidth={4}
          />
          <Marker coordinate={start} pinColor="green" title="시작" />
          <Marker coordinate={end} pinColor="red" title="종료" />
        </MapView>
      </View>
      <Text style={styles.note}>
        {route.length}개 포인트 · 직선 거리 기반 표시
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  empty: {
    color: colors.textDim,
    fontSize: 13,
  },
  note: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
});
