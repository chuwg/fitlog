import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import { dateToHM, hmToDate } from '../lib/time';

interface Props {
  label: string;
  value: string;
  onChange: (next: string) => void;
}

export function TimePickerRow({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(hmToDate(value));

  const handleAndroidChange = (
    event: DateTimePickerEvent,
    date?: Date,
  ) => {
    setOpen(false);
    if (event.type === 'set' && date) {
      onChange(dateToHM(date));
    }
  };

  const handleIosChange = (_: DateTimePickerEvent, date?: Date) => {
    if (date) setTemp(date);
  };

  const startEdit = () => {
    setTemp(hmToDate(value));
    setOpen(true);
  };

  const confirm = () => {
    onChange(dateToHM(temp));
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={startEdit} style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.chev}>›</Text>
        </View>
      </Pressable>

      {Platform.OS === 'android' && open && (
        <DateTimePicker
          mode="time"
          value={hmToDate(value)}
          onChange={handleAndroidChange}
          is24Hour
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          transparent
          visible={open}
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <DateTimePicker
                mode="time"
                value={temp}
                display="spinner"
                onChange={handleIosChange}
                textColor={colors.text}
                themeVariant="dark"
                locale="ko"
              />
              <View style={styles.sheetActions}>
                <Pressable onPress={() => setOpen(false)} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>취소</Text>
                </Pressable>
                <Pressable onPress={confirm} style={styles.btnPrimary}>
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: {
    color: colors.textDim,
    fontSize: 13,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  chev: {
    color: colors.textMuted,
    fontSize: 18,
    marginTop: -2,
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
