import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { isAvailable, recognizeText } from 'fitlog-vision-text';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { parseInbodyText } from '../src/lib/inbody-ocr';
import { insertInbodyRecord } from '../src/services/db';
import { colors, radius, spacing } from '../src/theme/colors';

interface FormState {
  weight: string;
  muscle: string;
  fatKg: string;
  fatPct: string;
  bmi: string;
  score: string;
}

function parseNumberOrNull(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const v = parseFloat(trimmed);
  return isNaN(v) ? null : v;
}

function parseIntOrNull(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const v = parseInt(trimmed, 10);
  return isNaN(v) ? null : v;
}

function formatDateLabel(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export default function InbodyEntryScreen() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [form, setForm] = useState<FormState>({
    weight: '',
    muscle: '',
    fatKg: '',
    fatPct: '',
    bmi: '',
    score: '',
  });
  const [ocrLoading, setOcrLoading] = useState(false);

  const set = (key: keyof FormState) => (v: string) =>
    setForm((s) => ({ ...s, [key]: v }));

  const runOcr = async (uri: string) => {
    setOcrLoading(true);
    try {
      const text = await recognizeText(uri);
      const result = parseInbodyText(text);
      const p = result.parsed;
      setForm((s) => ({
        weight: p.weightKg !== null ? String(p.weightKg) : s.weight,
        muscle: p.skeletalMuscleKg !== null ? String(p.skeletalMuscleKg) : s.muscle,
        fatKg: p.bodyFatKg !== null ? String(p.bodyFatKg) : s.fatKg,
        fatPct: p.bodyFatPct !== null ? String(p.bodyFatPct) : s.fatPct,
        bmi: p.bmi !== null ? String(p.bmi) : s.bmi,
        score: p.score !== null ? String(p.score) : s.score,
      }));
      if (result.matchedFields === 0) {
        Alert.alert(
          '인식 실패',
          '결과지에서 항목을 찾지 못했어요. 수동으로 입력해주세요.',
        );
      } else if (result.matchedFields < 4) {
        Alert.alert(
          '일부 인식 완료',
          `${result.matchedFields}/${result.totalFields}개 항목을 인식했어요. 나머지는 수동으로 입력해주세요.`,
        );
      }
    } catch (e: any) {
      Alert.alert('OCR 오류', e?.message ?? '텍스트 인식에 실패했습니다.');
    } finally {
      setOcrLoading(false);
    }
  };

  const captureFromCamera = async () => {
    if (!isAvailable()) {
      Alert.alert(
        'iOS 전용 기능',
        'Apple Vision OCR은 iOS dev client에서만 동작합니다. 수동 입력을 사용해주세요.',
      );
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('카메라 권한 필요', '설정에서 카메라 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    await runOcr(result.assets[0].uri);
  };

  const pickFromLibrary = async () => {
    if (!isAvailable()) {
      Alert.alert(
        'iOS 전용 기능',
        'Apple Vision OCR은 iOS dev client에서만 동작합니다. 수동 입력을 사용해주세요.',
      );
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('갤러리 권한 필요', '설정에서 사진 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    await runOcr(result.assets[0].uri);
  };

  const submit = async () => {
    const weight = parseNumberOrNull(form.weight);
    const muscle = parseNumberOrNull(form.muscle);
    const fatKg = parseNumberOrNull(form.fatKg);
    const fatPct = parseNumberOrNull(form.fatPct);
    const bmi = parseNumberOrNull(form.bmi);
    const score = parseIntOrNull(form.score);

    const allEmpty =
      weight === null &&
      muscle === null &&
      fatKg === null &&
      fatPct === null &&
      bmi === null &&
      score === null;
    if (allEmpty) {
      Alert.alert('입력 확인', '최소 한 가지 항목은 입력해주세요.');
      return;
    }

    await insertInbodyRecord({
      measuredAt: date.getTime(),
      weightKg: weight,
      skeletalMuscleKg: muscle,
      bodyFatKg: fatKg,
      bodyFatPct: fatPct,
      bmi,
      score,
    });
    router.back();
  };

  const openDatePicker = () => {
    setTempDate(date);
    setDatePickerOpen(true);
  };

  const handleAndroidDate = (event: any, picked?: Date) => {
    setDatePickerOpen(false);
    if (event.type === 'set' && picked) setDate(picked);
  };

  const handleIosDate = (_: any, picked?: Date) => {
    if (picked) setTempDate(picked);
  };

  const confirmIosDate = () => {
    setDate(tempDate);
    setDatePickerOpen(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '인바디 기록 추가',
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerTintColor: colors.mint,
          headerBackTitle: '취소',
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card title="결과지 인식 (Apple Vision)">
            <Text style={styles.ocrHint}>
              인바디 결과지를 촬영하거나 갤러리에서 불러오면 항목을 자동으로 채워드립니다.
            </Text>
            <View style={styles.ocrRow}>
              <Pressable
                onPress={captureFromCamera}
                disabled={ocrLoading}
                style={[styles.ocrBtn, ocrLoading && styles.ocrBtnDisabled]}
              >
                <Text style={styles.ocrBtnText}>📷 촬영</Text>
              </Pressable>
              <Pressable
                onPress={pickFromLibrary}
                disabled={ocrLoading}
                style={[styles.ocrBtn, ocrLoading && styles.ocrBtnDisabled]}
              >
                <Text style={styles.ocrBtnText}>🖼️ 갤러리</Text>
              </Pressable>
            </View>
            {ocrLoading && (
              <View style={styles.ocrLoadingRow}>
                <ActivityIndicator color={colors.mint} />
                <Text style={styles.ocrLoadingText}>텍스트 인식 중...</Text>
              </View>
            )}
          </Card>

          <Card title="측정일">
            <Pressable onPress={openDatePicker} style={styles.dateRow}>
              <Text style={styles.dateValue}>{formatDateLabel(date)}</Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          </Card>

          <Card title="측정값">
            <Field
              label="체중"
              unit="kg"
              value={form.weight}
              onChange={set('weight')}
            />
            <Field
              label="골격근량"
              unit="kg"
              value={form.muscle}
              onChange={set('muscle')}
            />
            <Field
              label="체지방량"
              unit="kg"
              value={form.fatKg}
              onChange={set('fatKg')}
            />
            <Field
              label="체지방률"
              unit="%"
              value={form.fatPct}
              onChange={set('fatPct')}
            />
            <Field label="BMI" unit="" value={form.bmi} onChange={set('bmi')} />
            <Field
              label="인바디 점수"
              unit="점"
              value={form.score}
              onChange={set('score')}
              integer
            />
          </Card>

          <Pressable onPress={submit} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>저장</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {Platform.OS === 'android' && datePickerOpen && (
        <DateTimePicker
          mode="date"
          value={date}
          maximumDate={new Date()}
          onChange={handleAndroidDate}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          transparent
          visible={datePickerOpen}
          animationType="fade"
          onRequestClose={() => setDatePickerOpen(false)}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setDatePickerOpen(false)}
          >
            <Pressable style={styles.sheet} onPress={() => {}}>
              <Text style={styles.sheetTitle}>측정일</Text>
              <DateTimePicker
                mode="date"
                value={tempDate}
                display="spinner"
                maximumDate={new Date()}
                onChange={handleIosDate}
                themeVariant="dark"
                locale="ko"
              />
              <View style={styles.sheetActions}>
                <Pressable
                  onPress={() => setDatePickerOpen(false)}
                  style={styles.btnGhost}
                >
                  <Text style={styles.btnGhostText}>취소</Text>
                </Pressable>
                <Pressable onPress={confirmIosDate} style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>확인</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

interface FieldProps {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  integer?: boolean;
}

function Field({ label, unit, value, onChange, integer }: FieldProps) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRight}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'}
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
        {unit !== '' && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dateValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  chev: {
    color: colors.textMuted,
    fontSize: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fieldLabel: {
    color: colors.textDim,
    fontSize: 14,
  },
  fieldRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
    textAlign: 'right',
  },
  unit: {
    color: colors.textDim,
    fontSize: 13,
    minWidth: 22,
  },
  saveBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '800',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.mint,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '700',
  },
  btnGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnGhostText: {
    color: colors.textDim,
    fontSize: 15,
    fontWeight: '600',
  },
  ocrHint: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  ocrRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ocrBtn: {
    flex: 1,
    backgroundColor: colors.mint + '22',
    borderColor: colors.mint,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  ocrBtnDisabled: {
    opacity: 0.5,
  },
  ocrBtnText: {
    color: colors.mint,
    fontSize: 14,
    fontWeight: '700',
  },
  ocrLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  ocrLoadingText: {
    color: colors.textDim,
    fontSize: 13,
  },
});
