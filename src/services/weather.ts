import type { WeatherInfo } from '../types';
import { resolveLocation, reverseGeocode } from './location';

const WEATHER_CODE_KR: Record<number, string> = {
  0: '맑음',
  1: '대체로 맑음',
  2: '부분적으로 흐림',
  3: '흐림',
  45: '안개',
  48: '짙은 안개',
  51: '이슬비',
  53: '보통 이슬비',
  55: '강한 이슬비',
  61: '약한 비',
  63: '비',
  65: '강한 비',
  71: '약한 눈',
  73: '눈',
  75: '폭설',
  77: '싸락눈',
  80: '소나기',
  81: '강한 소나기',
  82: '매우 강한 소나기',
  85: '약한 눈 소나기',
  86: '강한 눈 소나기',
  95: '뇌우',
  96: '뇌우(우박)',
  99: '강한 뇌우(우박)',
};

export async function fetchWeather(): Promise<WeatherInfo> {
  const loc = await resolveLocation();
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}` +
    `&longitude=${loc.longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m` +
    `&wind_speed_unit=kmh&timezone=auto`;
  const airUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.latitude}` +
    `&longitude=${loc.longitude}&current=pm2_5,pm10&timezone=auto`;

  const [weatherRes, airRes, name] = await Promise.all([
    fetch(weatherUrl).then((r) => r.json()),
    fetch(airUrl).then((r) => r.json()).catch(() => null),
    reverseGeocode(loc.latitude, loc.longitude).catch(() => null),
  ]);

  const c = weatherRes?.current ?? {};
  const code = Number(c.weather_code ?? 0);

  return {
    tempC: Math.round(Number(c.temperature_2m ?? 0)),
    feelsLikeC: Math.round(Number(c.apparent_temperature ?? 0)),
    weatherCode: code,
    description: WEATHER_CODE_KR[code] ?? '알 수 없음',
    humidity: Math.round(Number(c.relative_humidity_2m ?? 0)),
    windKmh: Math.round(Number(c.wind_speed_10m ?? 0)),
    pm25: airRes?.current?.pm2_5 != null ? Math.round(airRes.current.pm2_5) : undefined,
    pm10: airRes?.current?.pm10 != null ? Math.round(airRes.current.pm10) : undefined,
    locationName: name ?? (loc.isDefault ? '제주' : '현재 위치'),
    isDefaultLocation: loc.isDefault,
  };
}

export function airQualityLabel(pm25?: number): { label: string; color: string } {
  if (pm25 == null) return { label: '정보 없음', color: '#5F6C7B' };
  if (pm25 <= 15) return { label: '좋음', color: '#00D4AA' };
  if (pm25 <= 35) return { label: '보통', color: '#F5C451' };
  if (pm25 <= 75) return { label: '나쁨', color: '#FF9F43' };
  return { label: '매우나쁨', color: '#FF5C6B' };
}
