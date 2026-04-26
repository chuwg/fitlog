import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../Card';
import { colors, radius, spacing } from '../../theme/colors';
import { TIMING_LABEL, TIMING_ORDER } from '../../services/notifications';
import type { Supplement, SupplementTiming } from '../../types';

interface Props {
  items: Supplement[];
  onCreate: (input: Omit<Supplement, 'id'>) => void;
  onUpdate: (s: Supplement) => void;
  onDelete: (id: number) => void;
}

export function SupplementsSection({ items, onCreate, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [timing, setTiming] = useState<SupplementTiming>('morning');

  const submit = () => {
    if (!name.trim() || !dose.trim()) {
      Alert.alert('입력 확인', '이름과 용량을 입력해주세요');
      return;
    }
    onCreate({
      name: name.trim(),
      dose: dose.trim(),
      timing,
      shiftAdjust: timing === 'morning' || timing === 'bedtime',
      enabled: true,
    });
    setName('');
    setDose('');
    setTiming('morning');
    setShowForm(false);
  };

  const confirmDelete = (s: Supplement) => {
    Alert.alert('삭제', `${s.name}을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => onDelete(s.id) },
    ]);
  };

  return (
    <Card title="보충제">
      {items.length === 0 && (
        <Text style={styles.empty}>등록된 보충제가 없습니다.</Text>
      )}
      {items.map((s) => (
        <View key={s.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{s.name}</Text>
            <Text style={styles.meta}>
              {s.dose} · {TIMING_LABEL[s.timing]}
            </Text>
          </View>
          <View style={styles.switches}>
            <Toggle
              label="교대 연동"
              value={s.shiftAdjust}
              onChange={(v) => onUpdate({ ...s, shiftAdjust: v })}
            />
            <Toggle
              label="알림"
              value={s.enabled}
              onChange={(v) => onUpdate({ ...s, enabled: v })}
            />
          </View>
          <Pressable onPress={() => confirmDelete(s)} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>✕</Text>
          </Pressable>
        </View>
      ))}

      {showForm ? (
        <View style={styles.form}>
          <TextInput
            placeholder="이름 (예: 비타민D)"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="용량 (예: 1000IU)"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={dose}
            onChangeText={setDose}
          />
          <View style={styles.timingRow}>
            {TIMING_ORDER.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTiming(t)}
                style={[
                  styles.timingChip,
                  t === timing && styles.timingChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.timingText,
                    t === timing && styles.timingTextActive,
                  ]}
                >
                  {TIMING_LABEL[t]}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.formActions}>
            <Pressable
              onPress={() => {
                setShowForm(false);
                setName('');
                setDose('');
              }}
              style={styles.btnGhost}
            >
              <Text style={styles.btnGhostText}>취소</Text>
            </Pressable>
            <Pressable onPress={submit} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>추가</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setShowForm(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ 보충제 추가</Text>
        </Pressable>
      )}
    </Card>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.mint + '77' }}
        thumbColor={value ? colors.mint : colors.textMuted}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: colors.textDim,
    fontSize: 13,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  switches: {
    alignItems: 'flex-end',
    gap: 2,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleLabel: {
    color: colors.textDim,
    fontSize: 11,
    marginRight: 2,
  },
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  addBtn: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addBtnText: {
    color: colors.mint,
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timingChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timingChipActive: {
    backgroundColor: colors.mint + '22',
    borderColor: colors.mint,
  },
  timingText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  timingTextActive: {
    color: colors.mint,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.mint,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '700',
  },
  btnGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnGhostText: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
});
