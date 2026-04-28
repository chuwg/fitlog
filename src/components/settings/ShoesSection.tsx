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
import type { Shoe } from '../../types';

interface Props {
  items: Shoe[];
  onCreate: (input: Omit<Shoe, 'id'>) => void;
  onUpdate: (s: Shoe) => void;
  onDelete: (id: number) => void;
}

export function ShoesSection({ items, onCreate, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [targetKm, setTargetKm] = useState('');

  const submit = () => {
    if (!name.trim()) {
      Alert.alert('입력 확인', '신발 이름을 입력해주세요');
      return;
    }
    onCreate({
      name: name.trim(),
      brand: brand.trim() || null,
      currentKm: 0,
      targetKm: targetKm.trim() ? parseFloat(targetKm) : null,
      isActive: true,
    });
    setName('');
    setBrand('');
    setTargetKm('');
    setShowForm(false);
  };

  const confirmDelete = (s: Shoe) => {
    Alert.alert('삭제', `${s.name}을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => onDelete(s.id) },
    ]);
  };

  return (
    <Card title="러닝화">
      {items.length === 0 && (
        <Text style={styles.empty}>등록된 러닝화가 없습니다.</Text>
      )}
      {items.map((s) => {
        const ratio = s.targetKm
          ? Math.min(1, s.currentKm / s.targetKm)
          : 0;
        return (
          <View key={s.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{s.name}</Text>
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
                        backgroundColor:
                          ratio > 0.85 ? colors.bad : colors.mint,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
            <Switch
              value={s.isActive}
              onValueChange={(v) => onUpdate({ ...s, isActive: v })}
              trackColor={{ false: colors.border, true: colors.mint + '77' }}
              thumbColor={s.isActive ? colors.mint : colors.textMuted}
              ios_backgroundColor={colors.border}
            />
            <Pressable onPress={() => confirmDelete(s)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </Pressable>
          </View>
        );
      })}

      {showForm ? (
        <View style={styles.form}>
          <TextInput
            placeholder="이름 (예: Pegasus 41)"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="브랜드 (선택)"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
          />
          <View style={styles.inlineRow}>
            <TextInput
              placeholder="목표 km (선택, 예: 800)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { flex: 1 }]}
              value={targetKm}
              onChangeText={setTargetKm}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.formActions}>
            <Pressable
              onPress={() => {
                setShowForm(false);
                setName('');
                setBrand('');
                setTargetKm('');
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
          <Text style={styles.addBtnText}>+ 러닝화 추가</Text>
        </Pressable>
      )}
    </Card>
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
  inlineRow: {
    flexDirection: 'row',
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
