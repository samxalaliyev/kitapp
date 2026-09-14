import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export interface EnergyActionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionTitle: string;
  actionSubtitle?: string;
  energyCost: number;
  currentEnergy: number;
  isPremium: boolean;
  iconName?: keyof typeof Feather.glyphMap;
  confirmText?: string;
}

export function EnergyActionModal({
  visible,
  onClose,
  onConfirm,
  actionTitle,
  actionSubtitle,
  energyCost,
  currentEnergy,
  isPremium,
  iconName = 'zap',
  confirmText,
}: EnergyActionModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();

  if (!visible) return null;

  const actualConfirmText = confirmText || t('energy_modal_continue');
  const hasEnoughEnergy = isPremium || currentEnergy >= energyCost;
  const remainingEnergy = isPremium ? '∞' : Math.max(0, currentEnergy - energyCost);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          {/* Sheet Handle */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.surfaceBorder }]} />
          </View>

          {/* Icon Badge */}
          <View style={styles.iconWrap}>
            <View
              style={[
                styles.iconRing,
                {
                  backgroundColor: isPremium
                    ? 'rgba(99, 102, 241, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                  borderColor: isPremium ? '#818cf8' : '#f59e0b',
                },
              ]}
            >
              <Feather
                name={iconName}
                size={26}
                color={isPremium ? '#818cf8' : '#f59e0b'}
              />
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={[styles.title, { color: colors.text }]}>{actionTitle}</Text>
          {actionSubtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {actionSubtitle}
            </Text>
          ) : null}

          {/* Energy Cost Breakdown Card */}
          <View
            style={[
              styles.costCard,
              {
                backgroundColor: colors.bg,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.textMuted }]}>
                {t('energy_modal_cost_label')}
              </Text>
              <View style={styles.costBadge}>
                <Text style={styles.costBolt}>⚡</Text>
                <Text
                  style={[
                    styles.costValue,
                    { color: isPremium ? '#6366f1' : '#f59e0b' },
                  ]}
                >
                  {isPremium ? t('energy_modal_pro_unlimited') : `-${energyCost} ${t('energy_modal_energy_unit')}`}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.balanceRow}>
              <View>
                <Text style={[styles.balMetaLabel, { color: colors.textMuted }]}>
                  {t('energy_modal_current')}
                </Text>
                <Text style={[styles.balMetaValue, { color: colors.text }]}>
                  {isPremium ? '∞' : `${currentEnergy} ⚡`}
                </Text>
              </View>

              <Feather name="arrow-right" size={16} color={colors.textMuted} />

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.balMetaLabel, { color: colors.textMuted }]}>
                  {t('energy_modal_remaining')}
                </Text>
                <Text
                  style={[
                    styles.balMetaValue,
                    { color: hasEnoughEnergy ? colors.primary : '#ef4444' },
                  ]}
                >
                  {isPremium ? '∞' : `${remainingEnergy} ⚡`}
                </Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.actions}>
            {hasEnoughEnergy ? (
              <Pressable
                onPress={() => {
                  onClose();
                  onConfirm();
                }}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmBtnText}>
                  {isPremium ? actualConfirmText : `${actualConfirmText} (-${energyCost} ⚡)`}
                </Text>
              </Pressable>
            ) : (
              <View
                style={[
                  styles.notEnoughBox,
                  {
                    backgroundColor: colors.isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
                    borderColor: '#ef4444',
                  },
                ]}
              >
                <Text style={[styles.notEnoughText, { color: '#ef4444' }]}>
                  {t('energy_modal_not_enough')}
                </Text>
              </View>
            )}

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                {t('energy_modal_cancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  costCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costBolt: {
    fontSize: 14,
  },
  costValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  balMetaLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  balMetaValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  actions: {
    gap: Spacing.xs,
  },
  confirmBtn: {
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  notEnoughBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  notEnoughText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
