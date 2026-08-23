import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AdBannerContainer } from '@/components/AdBannerContainer';
import { IOSOptionPickerModal, type OptionItem } from '@/components/iOSOptionPickerModal';
import { SubscriptionPaywallModal } from '@/components/SubscriptionPaywallModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/constants';
import { clearTranslationCache } from '@/lib/i18n/cache';
import {
  FONT_FAMILY_LABELS,
  FONT_SIZE_LABELS,
  getReaderSettings,
  saveReaderSettings,
  type FontFamilyChoice,
  type FontSizeLevel,
} from '@/lib/reader/settings';
import { syncCloudData } from '@/lib/sync/sync-service';
import { useAppTheme, type ThemeMode } from '@/lib/theme';

interface SettingRowProps {
  iconName: keyof typeof Feather.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  isLast?: boolean;
}

function SettingRow({
  iconName,
  iconColor = '#d4af7a',
  iconBgColor = 'rgba(212, 175, 122, 0.12)',
  label,
  value,
  onPress,
  danger,
  isLast,
}: SettingRowProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        !isLast && { borderBottomWidth: 0.5, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
        pressed && onPress ? styles.pressed : undefined,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconBadge, { backgroundColor: iconBgColor }]}>
          <Feather name={iconName} size={16} color={danger ? '#ef4444' : iconColor} />
        </View>
        <Text
          style={[
            styles.settingLabel,
            { color: danger ? colors.danger : colors.text },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={styles.settingRight}>
        {value ? (
          <Text style={[styles.settingValue, { color: colors.textMuted }]}>
            {value}
          </Text>
        ) : null}
        {onPress ? (
          <Feather name="chevron-right" size={16} color={colors.textSubtle} />
        ) : null}
      </View>
    </Pressable>
  );
}

function SettingGroup({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.groupContainer}>
      {title ? (
        <Text style={[styles.groupHeaderTitle, { color: colors.textMuted }]}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.groupCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

type PickerType = 'theme' | 'fontSize' | 'fontFamily' | 'targetLang' | 'uiLang' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, setMode, colors } = useAppTheme();
  const { targetLang, uiLang, setTargetLang, setUILang, t } = useLanguage();
  const {
    user,
    profile,
    subscriptionPlan,
    isPremium,
    isAdmin,
    usedTranslationsToday,
    limits,
    logout,
    watchAdForWords,
  } = useAuth();

  const [fontSize, setFontSizeState] = useState<FontSizeLevel>('normal');
  const [fontFamily, setFontFamilyState] = useState<FontFamilyChoice>('serif');
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Active Picker Modal State
  const [activePicker, setActivePicker] = useState<PickerType>(null);

  useEffect(() => {
    let cancelled = false;
    getReaderSettings().then((s) => {
      if (cancelled) return;
      setFontSizeState(s.fontSize);
      setFontFamilyState(s.fontFamily);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSync = async () => {
    if (!user) {
      router.push('/(auth)/login' as any);
      return;
    }
    setSyncing(true);
    try {
      const res = await syncCloudData(user.id);
      if (res.error) {
        Alert.alert(t('sync_success_title'), res.error);
      } else {
        Alert.alert(t('sync_success_title'), t('sync_success_msg'));
      }
    } finally {
      setSyncing(false);
    }
  };

  const clearCache = useCallback(() => {
    Alert.alert(
      t('clear_cache'),
      'Keş olunmuş kitab faylları və tərcümə keçləri silinəcək. Davam etmək istəyirsiniz?',
      [
        { text: t('not_now'), style: 'cancel' },
        {
          text: t('clear_cache'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearTranslationCache();
              Alert.alert('Hazırdır', 'Yaddaş keşi uğurla təmizləndi.');
            } catch (err) {
              Alert.alert('Xəta', 'Yaddaş təmizlənərkən xəta baş verdi.');
            }
          },
        },
      ],
    );
  }, [t]);

  const planBadgeText = isAdmin
    ? 'ADMIN'
    : subscriptionPlan === 'premium_yearly'
    ? t('plan_yearly').toUpperCase()
    : subscriptionPlan === 'premium_monthly'
    ? t('plan_monthly').toUpperCase()
    : t('plan_free_badge');

  // Options Data for Pickers
  const themeOptions: OptionItem<ThemeMode>[] = [
    { id: 'system', label: 'Sistem (Avtomatik)' },
    { id: 'dark', label: 'Karanlık Mod' },
    { id: 'light', label: 'Açık Mod' },
  ];

  const fontSizeOptions: OptionItem<FontSizeLevel>[] = [
    { id: 'small', label: FONT_SIZE_LABELS.small },
    { id: 'normal', label: FONT_SIZE_LABELS.normal },
    { id: 'large', label: FONT_SIZE_LABELS.large },
    { id: 'xlarge', label: FONT_SIZE_LABELS.xlarge },
  ];

  const fontFamilyOptions: OptionItem<FontFamilyChoice>[] = [
    { id: 'serif', label: FONT_FAMILY_LABELS.serif },
    { id: 'sans', label: FONT_FAMILY_LABELS.sans },
    { id: 'noah', label: FONT_FAMILY_LABELS.noah },
    { id: 'lovelo', label: FONT_FAMILY_LABELS.lovelo },
  ];

  const currentTargetLang = getLanguage(targetLang);
  const currentUILang = getLanguage(uiLang);

  const languageOptions: OptionItem<LanguageCode>[] = SUPPORTED_LANGUAGES.map((l) => ({
    id: l.code,
    label: `${l.flag} ${l.nativeLabel}`,
    subLabel: l.label,
  }));

  const dailyLimitNum = typeof limits.dailyTranslationLimit === 'number' ? limits.dailyTranslationLimit : 40;
  const usagePercent = Math.min(100, Math.round((usedTranslationsToday / dailyLimitNum) * 100));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('profile_title')}</Text>

        {/* ==================================================================== */}
        {/* PROFILE ROW */}
        {/* ==================================================================== */}
        {!user ? (
          /* Unauthenticated Guest Card */
          <View
            style={[
              styles.profileCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.profileTopRow}>
              <View style={[styles.avatarBadge, { backgroundColor: colors.primaryBg }]}>
                <Feather name="user" size={24} color={colors.primary} />
              </View>
              <View style={styles.profileMainInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {t('guest_user')}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                  {t('guest_sub')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/(auth)/login' as any)}
              style={({ pressed }) => [
                styles.primaryPillBtn,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.primaryPillBtnText, { color: '#0d0f17' }]}>
                {t('login_register_btn')}
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Authenticated User Card */
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.surface,
                borderColor: isPremium ? colors.primary : colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.profileTopRow}>
              <View style={[styles.avatarBadge, { backgroundColor: colors.primaryBg }]}>
                <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                  {profile?.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>

              <View style={styles.profileMainInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {profile?.displayName || user.email?.split('@')[0]}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                  {user.email}
                </Text>
              </View>

              <View
                style={[
                  styles.planBadge,
                  { backgroundColor: isPremium ? colors.primary : colors.surfaceBorder },
                ]}
              >
                <Text style={[styles.planBadgeText, { color: isPremium ? '#0d0f17' : colors.textMuted }]}>
                  {planBadgeText}
                </Text>
              </View>
            </View>

            {/* Daily Usage Progress Bar for Free Users */}
            {!isPremium ? (
              <View style={styles.usageBarSection}>
                <View style={styles.usageLabelRow}>
                  <Text style={[styles.usageTitle, { color: colors.textMuted }]}>
                    {t('daily_translation_label')}
                  </Text>
                  <Text style={[styles.usageCount, { color: colors.text }]}>
                    {usedTranslationsToday} / {dailyLimitNum} {t('words_unit')}
                  </Text>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceBorder }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${usagePercent}%`,
                        backgroundColor: usagePercent >= 90 ? colors.danger : colors.primary,
                      },
                    ]}
                  />
                </View>

                <Pressable
                  onPress={watchAdForWords}
                  style={({ pressed }) => [
                    styles.watchAdSubRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Feather name="play-circle" size={14} color={colors.primary} />
                  <Text style={[styles.watchAdSubText, { color: colors.primary }]}>
                    {t('watch_ad_words_btn')?.replace('🎥', '')?.trim()}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Profile Action Buttons */}
            <View style={styles.profileActionsRow}>
              <Pressable
                onPress={handleSync}
                disabled={syncing}
                style={({ pressed }) => [
                  styles.profilePillBtn,
                  { backgroundColor: colors.surfaceBorder },
                  pressed && styles.pressed,
                ]}
              >
                <Feather name="cloud" size={14} color={colors.text} style={{ marginRight: 6 }} />
                <Text style={[styles.profilePillText, { color: colors.text }]}>
                  {syncing ? t('syncing_btn') : t('cloud_sync_btn')?.replace('☁️', '')?.trim()}
                </Text>
              </Pressable>

              <Pressable
                onPress={logout}
                style={({ pressed }) => [
                  styles.profilePillBtn,
                  { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                  pressed && styles.pressed,
                ]}
              >
                <Feather name="log-out" size={14} color={colors.danger} style={{ marginRight: 6 }} />
                <Text style={[styles.profilePillText, { color: colors.danger }]}>
                  {t('logout_btn')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Google Ad Banner for Free Users */}
        <AdBannerContainer onUpgradePress={() => setPaywallVisible(true)} />

        {/* ==================================================================== */}
        {/* GROUP 1: READING & THEME */}
        {/* ==================================================================== */}
        <SettingGroup title={t('section_reading_theme')}>
          <SettingRow
            iconName="moon"
            label={t('theme_mode')}
            value={mode === 'system' ? 'Sistem' : mode === 'dark' ? 'Karanlık' : 'Açık'}
            onPress={() => setActivePicker('theme')}
          />
          <SettingRow
            iconName="type"
            label={t('font_size')}
            value={FONT_SIZE_LABELS[fontSize]}
            onPress={() => setActivePicker('fontSize')}
          />
          <SettingRow
            iconName="edit-3"
            label={t('font_family')}
            value={FONT_FAMILY_LABELS[fontFamily]}
            onPress={() => setActivePicker('fontFamily')}
            isLast
          />
        </SettingGroup>

        {/* ==================================================================== */}
        {/* GROUP 2: LANGUAGE & TRANSLATION */}
        {/* ==================================================================== */}
        <SettingGroup title={t('section_lang_trans')}>
          <SettingRow
            iconName="globe"
            label={t('target_language')}
            value={`${currentTargetLang.flag} ${currentTargetLang.nativeLabel}`}
            onPress={() => setActivePicker('targetLang')}
          />
          <SettingRow
            iconName="layout"
            label={t('ui_language')}
            value={`${currentUILang.flag} ${currentUILang.nativeLabel}`}
            onPress={() => setActivePicker('uiLang')}
          />
          <SettingRow
            iconName="trash-2"
            iconColor="#ef4444"
            iconBgColor="rgba(239, 68, 68, 0.12)"
            label={t('clear_cache')}
            onPress={clearCache}
            danger
            isLast
          />
        </SettingGroup>

        {/* ==================================================================== */}
        {/* GROUP 3: MONETIZATION & ABOUT */}
        {/* ==================================================================== */}
        <SettingGroup title={t('section_about')}>
          {!isPremium ? (
            <SettingRow
              iconName="award"
              label={t('remove_ads_upgrade')?.replace('👑', '')?.trim()}
              onPress={() => setPaywallVisible(true)}
            />
          ) : null}
          <SettingRow
            iconName="info"
            iconColor="#94a3b8"
            iconBgColor="rgba(148, 163, 184, 0.12)"
            label={t('version')}
            value="1.0.0"
            isLast
          />
        </SettingGroup>

        {/* iOS Option Pickers Modals */}
        <IOSOptionPickerModal
          visible={activePicker === 'theme'}
          title={t('theme_mode')}
          options={themeOptions}
          selectedId={mode}
          onSelect={(id: ThemeMode) => setMode(id)}
          onClose={() => setActivePicker(null)}
        />

        <IOSOptionPickerModal
          visible={activePicker === 'fontSize'}
          title={t('font_size')}
          options={fontSizeOptions}
          selectedId={fontSize}
          onSelect={(id: FontSizeLevel) => {
            setFontSizeState(id);
            saveReaderSettings({ fontSize: id }).catch(() => {});
          }}
          onClose={() => setActivePicker(null)}
        />

        <IOSOptionPickerModal
          visible={activePicker === 'fontFamily'}
          title={t('font_family')}
          options={fontFamilyOptions}
          selectedId={fontFamily}
          onSelect={(id: FontFamilyChoice) => {
            setFontFamilyState(id);
            saveReaderSettings({ fontFamily: id }).catch(() => {});
          }}
          onClose={() => setActivePicker(null)}
        />

        <IOSOptionPickerModal
          visible={activePicker === 'targetLang'}
          title={t('target_language')}
          options={languageOptions}
          selectedId={targetLang}
          onSelect={(id: LanguageCode) => setTargetLang(id)}
          onClose={() => setActivePicker(null)}
        />

        <IOSOptionPickerModal
          visible={activePicker === 'uiLang'}
          title={t('ui_language')}
          options={languageOptions}
          selectedId={uiLang}
          onSelect={(id: LanguageCode) => setUILang(id)}
          onClose={() => setActivePicker(null)}
        />

        {/* Paywall Modal */}
        <SubscriptionPaywallModal
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
    letterSpacing: 0.3,
  },
  profileCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
  },
  profileMainInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: FontSize.xs,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  primaryPillBtn: {
    marginTop: Spacing.md,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPillBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  usageBarSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  usageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  usageTitle: {
    fontSize: FontSize.xs,
  },
  usageCount: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  watchAdSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  watchAdSubText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  profilePillBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  groupContainer: {
    marginBottom: Spacing.lg,
  },
  groupHeaderTitle: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  groupCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: FontSize.sm,
  },
  pressed: {
    opacity: 0.8,
  },
});
