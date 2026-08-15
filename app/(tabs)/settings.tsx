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
  setFontFamily,
  setFontSize,
  type FontFamilyChoice,
  type FontSizeLevel,
} from '@/lib/reader/settings';
import { syncCloudData } from '@/lib/sync/sync-service';
import { useAppTheme, type ThemeMode } from '@/lib/theme';

interface SettingRowProps {
  icon: string;
  iconBgColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  isLast?: boolean;
}

function SettingRow({
  icon,
  iconBgColor = '#3b82f6',
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
        !isLast && { borderBottomWidth: 0.5, borderBottomColor: colors.surfaceBorder },
        pressed && onPress ? styles.pressed : undefined,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconBadge, { backgroundColor: iconBgColor }]}>
          <Text style={styles.iconBadgeText}>{icon}</Text>
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
          <Text style={[styles.chevron, { color: colors.textSubtle }]}>›</Text>
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
  const [fontFamily, setFontFamilyState] = useState<FontFamilyChoice>('system');
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
    ? 'ADMIN 🛠️'
    : subscriptionPlan === 'premium_yearly'
    ? t('plan_yearly').toUpperCase() + ' 🌟'
    : subscriptionPlan === 'premium_monthly'
    ? t('plan_monthly').toUpperCase() + ' 🗓️'
    : t('plan_free_badge');

  // Options Data for Pickers
  const themeOptions: OptionItem<ThemeMode>[] = [
    { id: 'system', label: 'Sistem (Avtomatik)' },
    { id: 'dark', label: 'Karanlık Mod 🌙' },
    { id: 'light', label: 'Açık Mod ☀️' },
  ];

  const fontSizeOptions: OptionItem<FontSizeLevel>[] = [
    { id: 'small', label: FONT_SIZE_LABELS.small },
    { id: 'normal', label: FONT_SIZE_LABELS.normal },
    { id: 'large', label: FONT_SIZE_LABELS.large },
    { id: 'xlarge', label: FONT_SIZE_LABELS.xlarge },
  ];

  const fontFamilyOptions: OptionItem<FontFamilyChoice>[] = [
    { id: 'system', label: FONT_FAMILY_LABELS.system },
    { id: 'serif', label: FONT_FAMILY_LABELS.serif },
    { id: 'sans', label: FONT_FAMILY_LABELS.sans },
    { id: 'mono', label: FONT_FAMILY_LABELS.mono },
    { id: 'georgia', label: FONT_FAMILY_LABELS.georgia },
  ];

  const currentTargetLang = getLanguage(targetLang);
  const currentUILang = getLanguage(uiLang);

  const languageOptions: OptionItem<LanguageCode>[] = SUPPORTED_LANGUAGES.map((l) => ({
    id: l.code,
    label: `${l.flag} ${l.nativeLabel}`,
    subLabel: l.label,
  }));

  // Usage percentage for Free users
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
        {/* iOS APPLE ID STYLE PROFILE ROW */}
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
                <Text style={styles.avatarEmoji}>👤</Text>
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
              <Text style={styles.primaryPillBtnText}>{t('login_register_btn')}</Text>
            </Pressable>
          </View>
        ) : (
          /* Authenticated User Card */
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.surface,
                borderColor: isPremium ? '#f59e0b' : colors.surfaceBorder,
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
                  { backgroundColor: isPremium ? '#f59e0b' : colors.surfaceBorder },
                ]}
              >
                <Text style={styles.planBadgeText}>{planBadgeText}</Text>
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
                  <Text style={[styles.watchAdSubText, { color: colors.primary }]}>
                    {t('watch_ad_words_btn')}
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
                <Text style={[styles.profilePillText, { color: colors.text }]}>
                  {syncing ? t('syncing_btn') : t('cloud_sync_btn')}
                </Text>
              </Pressable>

              <Pressable
                onPress={logout}
                style={({ pressed }) => [
                  styles.profilePillBtn,
                  { backgroundColor: colors.surfaceBorder },
                  pressed && styles.pressed,
                ]}
              >
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
        {/* GROUP 1: READING & THEME (OKUMA VE TEMA) */}
        {/* ==================================================================== */}
        <SettingGroup title={t('section_reading_theme')}>
          <SettingRow
            icon="🌙"
            iconBgColor="#8b5cf6"
            label={t('theme_mode')}
            value={mode === 'system' ? 'Sistem' : mode === 'dark' ? 'Karanlık' : 'Açık'}
            onPress={() => setActivePicker('theme')}
          />
          <SettingRow
            icon="🔤"
            iconBgColor="#3b82f6"
            label={t('font_size')}
            value={FONT_SIZE_LABELS[fontSize]}
            onPress={() => setActivePicker('fontSize')}
          />
          <SettingRow
            icon="🖌️"
            iconBgColor="#ec4899"
            label={t('font_family')}
            value={FONT_FAMILY_LABELS[fontFamily]}
            onPress={() => setActivePicker('fontFamily')}
            isLast
          />
        </SettingGroup>

        {/* ==================================================================== */}
        {/* GROUP 2: LANGUAGE & TRANSLATION (DİL VE ÇEVİRİ) */}
        {/* ==================================================================== */}
        <SettingGroup title={t('section_lang_trans')}>
          <SettingRow
            icon="🌐"
            iconBgColor="#10b981"
            label={t('target_language')}
            value={`${currentTargetLang.flag} ${currentTargetLang.nativeLabel}`}
            onPress={() => setActivePicker('targetLang')}
          />
          <SettingRow
            icon="📱"
            iconBgColor="#06b6d4"
            label={t('ui_language')}
            value={`${currentUILang.flag} ${currentUILang.nativeLabel}`}
            onPress={() => setActivePicker('uiLang')}
          />
          <SettingRow
            icon="🗑️"
            iconBgColor="#ef4444"
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
              icon="🌟"
              iconBgColor="#f59e0b"
              label={t('remove_ads_upgrade')}
              onPress={() => setPaywallVisible(true)}
            />
          ) : null}
          <SettingRow
            icon="ℹ️"
            iconBgColor="#64748b"
            label={t('version')}
            value="1.0.0 (Build 42)"
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
            setFontSize(id).catch(() => {});
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
            setFontFamily(id).catch(() => {});
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
    paddingBottom: 130,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  /* Profile Card (iOS Apple ID Style) */
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
  avatarEmoji: {
    fontSize: 24,
  },
  profileMainInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  profileEmail: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  planBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  /* Usage Progress Bar */
  usageBarSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  watchAdSubText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  /* Profile Action Buttons */
  profileActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  profilePillBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  profilePillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  primaryPillBtn: {
    paddingVertical: 12,
    borderRadius: Radius.pill,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  primaryPillBtnText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  /* iOS Grouped Sections */
  groupContainer: {
    marginBottom: Spacing.xl,
  },
  groupHeaderTitle: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeText: {
    fontSize: 16,
  },
  settingLabel: {
    fontSize: FontSize.md,
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
  chevron: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.75,
  },
});
