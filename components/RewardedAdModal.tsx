import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { RewardedVideoPlayerModal } from '@/components/RewardedVideoPlayerModal';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export interface RewardedAdModalProps {
  visible: boolean;
  type: 'translations' | 'downloads' | 'font';
  onClose: () => void;
  onWatchAd: () => void;
  onUpgradePremium: () => void;
}

export function RewardedAdModal({
  visible,
  type,
  onClose,
  onWatchAd,
  onUpgradePremium,
}: RewardedAdModalProps) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const title =
    type === 'translations'
      ? t('limit_translations_title')
      : type === 'downloads'
      ? t('limit_downloads_title')
      : t('reader_label_font_family');

  const subtitle =
    type === 'translations'
      ? t('limit_translations_sub')
      : type === 'downloads'
      ? t('limit_downloads_sub')
      : t('reader_label_font_family');

  const adButtonText =
    type === 'translations'
      ? t('watch_ad_translations')
      : type === 'downloads'
      ? t('watch_ad_downloads')
      : t('watch_ad_words_btn');

  return (
    <>
      <Modal visible={visible && !showVideoPlayer} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>{subtitle}</Text>

            <View style={styles.btnRow}>
              {/* Option A: Rewarded Ad */}
              <Pressable
                onPress={() => setShowVideoPlayer(true)}
                style={({ pressed }) => [
                  styles.adBtn,
                  { backgroundColor: colors.isDark ? '#312e81' : '#e0e7ff' },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.adBtnText, { color: colors.isDark ? '#818cf8' : '#3730a3' }]}>
                  {adButtonText}
                </Text>
              </Pressable>

              {/* Option B: Premium Upgrade */}
              <Pressable
                onPress={() => {
                  onClose();
                  onUpgradePremium();
                }}
                style={({ pressed }) => [
                  styles.premiumBtn,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.premiumBtnText}>{t('upgrade_premium_btn')}</Text>
              </Pressable>

              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>{t('not_now')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <RewardedVideoPlayerModal
        visible={showVideoPlayer}
        onClose={() => setShowVideoPlayer(false)}
        onRewardEarned={() => {
          onClose();
          onWatchAd();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  sub: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnRow: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  adBtn: {
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  adBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  premiumBtn: {
    paddingVertical: 16,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  premiumBtnText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: FontSize.sm,
  },
  pressed: {
    opacity: 0.8,
  },
});
