import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

  const set = (key: keyof FormState) => (v: string) =>
    setForm((s) => ({ ...s, [key]: v }));

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
});
