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
import type { Shoe, ShoePurpose } from '../../types';

interface Props {
  items: Shoe[];
  onCreate: (input: Omit<Shoe, 'id'>) => void;
  onUpdate: (s: Shoe) => void;
  onDelete: (id: number) => void;
}

const PURPOSES: Array<{ value: ShoePurpose; label: string; color: string }> = [
  { value: 'general', label: '일반훈련', color: colors.mint },
  { value: 'recovery', label: '회복', color: colors.sleep },
  { value: 'race', label: '대회', color: colors.bad },
];

const PURPOSE_LABEL: Record<ShoePurpose, string> = {
  general: '일반훈련',
  recovery: '회복',
  race: '대회',
};

const PURPOSE_COLOR: Record<ShoePurpose, string> = {
  general: colors.mint,
  recovery: colors.sleep,
  race: colors.bad,
};

interface FormState {
  name: string;
  brand: string;
  purpose: ShoePurpose;
  currentKm: string;
  targetKm: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  brand: '',
  purpose: 'general',
  currentKm: '0',
  targetKm: '',
};

export function ShoesSection({ items, onCreate, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const startNew = () => {
    setEditingId('new');
    setForm(EMPTY_FORM);
  };

  const startEdit = (s: Shoe) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      brand: s.brand ?? '',
      purpose: s.purpose,
      currentKm: String(s.currentKm),
      targetKm: s.targetKm ? String(s.targetKm) : '',
    });
  };

  const cancel = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = () => {
    if (!form.name.trim()) {
      Alert.alert('입력 확인', '모델명을 입력해주세요');
      return;
    }
    const currentKm = parseFloat(form.currentKm);
    const targetKm = form.targetKm.trim() ? parseFloat(form.targetKm) : null;
    if (isNaN(currentKm) || currentKm < 0) {
      Alert.alert('입력 확인', '현재 km 값이 올바르지 않습니다');
      return;
    }
    if (targetKm !== null && (isNaN(targetKm) || targetKm <= 0)) {
      Alert.alert('입력 확인', '목표 km 값이 올바르지 않습니다');
      return;
    }
    if (editingId === 'new') {
      onCreate({
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        purpose: form.purpose,
        currentKm,
        targetKm,
        isActive: true,
        replacementAlerted: false,
      });
    } else if (typeof editingId === 'number') {
      const original = items.find((x) => x.id === editingId);
      if (original) {
        const stillUnderThreshold =
          targetKm === null || currentKm < targetKm * 0.9;
        onUpdate({
          ...original,
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          purpose: form.purpose,
          currentKm,
          targetKm,
          replacementAlerted: stillUnderThreshold
            ? false
            : original.replacementAlerted,
        });
      }
    }
    cancel();
  };

  const confirmDelete = (s: Shoe) => {
    Alert.alert('삭제', `${s.name}을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => onDelete(s.id) },
    ]);
  };

  return (
    <Card title="러닝화">
      {items.length === 0 && editingId !== 'new' && (
        <Text style={styles.empty}>등록된 러닝화가 없습니다.</Text>
      )}

      {items.map((s) => {
        if (editingId === s.id) {
          return (
            <FormBlock
              key={s.id}
              form={form}
              setForm={setForm}
              onCancel={cancel}
              onSubmit={submit}
              submitLabel="저장"
            />
          );
        }
        const ratio = s.targetKm
          ? Math.min(1, s.currentKm / s.targetKm)
          : 0;
        const overdue = s.targetKm ? s.currentKm >= s.targetKm * 0.9 : false;
        return (
          <View key={s.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerRow}>
                <Text style={styles.name}>{s.name}</Text>
                <View
                  style={[
                    styles.tag,
                    { backgroundColor: PURPOSE_COLOR[s.purpose] + '22' },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: PURPOSE_COLOR[s.purpose] },
                    ]}
                  >
                    {PURPOSE_LABEL[s.purpose]}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {s.brand ? `${s.brand} · ` : ''}
                {s.currentKm.toFixed(1)}km
                {s.targetKm ? ` / ${s.targetKm.toFixed(0)}km` : ''}
              </Text>
              {s.targetKm && (
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${ratio * 100}%`,
                        backgroundColor: overdue ? colors.bad : colors.mint,
                      },
                    ]}
                  />
                </View>
              )}
              {overdue && (
                <Text style={styles.warn}>교체 시기 임박</Text>
              )}
            </View>
            <View style={styles.actions}>
              <Switch
                value={s.isActive}
                onValueChange={(v) => onUpdate({ ...s, isActive: v })}
                trackColor={{ false: colors.border, true: colors.mint + '77' }}
                thumbColor={s.isActive ? colors.mint : colors.textMuted}
                ios_backgroundColor={colors.border}
              />
              <View style={styles.iconBtns}>
                <Pressable onPress={() => startEdit(s)} style={styles.iconBtn}>
                  <Text style={styles.iconText}>✎</Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(s)}
                  style={styles.iconBtn}
                >
                  <Text style={styles.iconText}>✕</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}

      {editingId === 'new' ? (
        <FormBlock
          form={form}
          setForm={setForm}
          onCancel={cancel}
          onSubmit={submit}
          submitLabel="추가"
        />
      ) : (
        <Pressable onPress={startNew} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ 러닝화 추가</Text>
        </Pressable>
      )}
    </Card>
  );
}

interface FormBlockProps {
  form: FormState;
  setForm: (s: FormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}

function FormBlock({
  form,
  setForm,
  onCancel,
  onSubmit,
  submitLabel,
}: FormBlockProps) {
  return (
    <View style={styles.form}>
      <TextInput
        placeholder="브랜드 (예: Nike)"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={form.brand}
        onChangeText={(v) => setForm({ ...form, brand: v })}
      />
      <TextInput
        placeholder="모델명 (예: Pegasus 41)"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={form.name}
        onChangeText={(v) => setForm({ ...form, name: v })}
      />
      <View style={styles.purposeRow}>
        {PURPOSES.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => setForm({ ...form, purpose: p.value })}
            style={[
              styles.purposeChip,
              form.purpose === p.value && {
                backgroundColor: p.color + '22',
                borderColor: p.color,
              },
            ]}
          >
            <Text
              style={[
                styles.purposeText,
                form.purpose === p.value && { color: p.color },
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.kmRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kmLabel}>현재 km</Text>
          <TextInput
            keyboardType="decimal-pad"
            style={styles.input}
            value={form.currentKm}
            onChangeText={(v) => setForm({ ...form, currentKm: v })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kmLabel}>목표 km</Text>
          <TextInput
            keyboardType="decimal-pad"
            placeholder="예: 800"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={form.targetKm}
            onChangeText={(v) => setForm({ ...form, targetKm: v })}
          />
        </View>
      </View>
      <View style={styles.formActions}>
        <Pressable onPress={onCancel} style={styles.btnGhost}>
          <Text style={styles.btnGhostText}>취소</Text>
        </Pressable>
        <Pressable onPress={onSubmit} style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>{submitLabel}</Text>
        </Pressable>
      </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  meta: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  track: {
    height: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  warn: {
    color: colors.bad,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  iconBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  iconText: {
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
  purposeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  purposeChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  purposeText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
  },
  kmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kmLabel: {
    color: colors.textDim,
    fontSize: 11,
    marginBottom: 2,
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
