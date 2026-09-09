import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export type LegalType = 'privacy' | 'terms' | null;

export interface LegalModalProps {
  type: LegalType;
  visible: boolean;
  onClose: () => void;
}

export function LegalModal({ type, visible, onClose }: LegalModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { uiLang, t } = useLanguage();

  if (!visible || !type) return null;

  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? t('privacy_policy') || 'Məxfilik Siyasəti' : t('terms_of_service') || 'İstifadə Şərtləri';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + Spacing.sm }]}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={{ width: 36 }} />
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Legal Text Content */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          {isPrivacy ? (
            /* ================= PRIVACY POLICY ================= */
            <View style={styles.contentWrap}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(212, 175, 122, 0.15)' }]}>
                <Text style={[styles.badgeText, { color: '#d4af7a' }]}>Litera App • Rəsmi Məxfilik Bəyannaməsi</Text>
              </View>

              <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
                Son Yenilənmə: 24 Avqust 2026
              </Text>

              <Text style={[styles.paragraph, { color: colors.text }]}>
                <Text style={styles.bold}>Litera</Text> ("biz", "tətbiqimiz") istifadəçilərin məxfiliyinə və şəxsi məlumatlarının təhlükəsizliyinə xüsusi önəm verir. Bu Məxfilik Siyasəti tətbiqimizdən istifadə edərkən hansı məlumatların toplandığını və necə qorunduğunu izah edir.
              </Text>

              {/* Content Render based on Language */}
              {uiLang === 'az' ? (
                <>
                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>1. Toplanan Məlumatlar</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    • <Text style={styles.bold}>Lokal Məlumatlar:</Text> Yadda saxladığınız sözlər, oxuma tərəqqiniz, şrift və tema parametrləri cihazınızın daxili yaddaşında (SQLite & AsyncStorage) saxlanılır.
                    {'\n'}• <Text style={styles.bold}>Hesab Məlumatları (Könüllü):</Text> Qeydiyyatdan keçdiyiniz halda e-poçt ünvanınız və istifadəçi adınız Supabase bulud bazasında cihazlararası sinxronizasiya üçün saxlanılır.
                    {'\n'}• <Text style={styles.bold}>Anonim Texniki Loqlar:</Text> Tətbiqin sabitliyini artırmaq üçün yalnız texniki xəta loqları qeydə alına bilər.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>2. Məlumatların İstifadə Məqsədi</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    Toplanan məlumatlar yalnız aşağıdakı məqsədlər üçün istifadə olunur:
                    {'\n'}• Oxuma prosesinizi və lüğətinizi cihazlarınız arasında sinxronlaşdırmaq;
                    {'\n'}• Tərcümə və tələffüz xidmətlərini operativ təmin etmək;
                    {'\n'}• Lüğət oyunları və test statistikalarınızı hesablamaq.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>3. Reklam və Tərəfdaşlıq</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    Tətbiq pulsuz versiyada tərcümə limitini artırmaq üçün mükafatlı video təqdim edə bilər. İstifadəçi istədiyi zaman Premium abunəlik ilə bütün sponsor məzmunlarını söndürə bilər.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>4. Hesabın və Məlumatların Silinməsi Hüququ</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    İstifadəçi istənilən vaxt <Text style={styles.bold}>Ayarlar → Hesabı Sil</Text> bölməsindən öz hesabını, bütün bulud məlumatlarını və cihazdakı qeydlərini birdəfəlik və dərhal silmək hüququna malikdir.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>5. Əlaqə</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    Məxfilik siyasəti ilə bağlı suallarınız üçün:
                    {'\n'}📧 <Text style={styles.bold}>contact@litera.app</Text>
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>1. Information We Collect</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    • <Text style={styles.bold}>Local Data:</Text> Saved vocabulary words, reading progress, and reader preferences are stored securely on your device (SQLite & local storage).
                    {'\n'}• <Text style={styles.bold}>Account Information (Optional):</Text> If you create an account, your email address and display name are stored in our secure cloud to sync your library across devices.
                    {'\n'}• <Text style={styles.bold}>Technical Diagnostics:</Text> Anonymous diagnostics may be processed solely to ensure application reliability and performance.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>2. How We Use Information</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    We use your data solely to:
                    {'\n'}• Synchronize your reading progress and vocabulary bank across your devices;
                    {'\n'}• Deliver contextual word translations and audio pronunciations;
                    {'\n'}• Calculate review intervals for flashcard and vocabulary practice.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>3. Advertising & Rewards</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    Free tier users may access rewarded bonus opportunities to earn extra translations. Premium members enjoy a completely ad-free experience.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>4. Right to Delete Your Account</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    In compliance with global data protection standards, you have the right to permanently delete your account and all associated cloud and local data at any time via <Text style={styles.bold}>Settings → Delete Account</Text>.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>5. Contact Us</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    For questions regarding our Privacy Policy:
                    {'\n'}📧 <Text style={styles.bold}>contact@litera.app</Text>
                  </Text>
                </>
              )}
            </View>
          ) : (
            /* ================= TERMS OF SERVICE ================= */
            <View style={styles.contentWrap}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(212, 175, 122, 0.15)' }]}>
                <Text style={[styles.badgeText, { color: '#d4af7a' }]}>Litera App • {uiLang === 'az' ? 'İstifadə Şərtləri' : 'Terms of Service'}</Text>
              </View>

              <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
                {uiLang === 'az' ? 'Son Yenilənmə: 24 Avqust 2026' : 'Last Updated: August 24, 2026'}
              </Text>

              <Text style={[styles.paragraph, { color: colors.text }]}>
                {uiLang === 'az'
                  ? 'Litera tətbiqini yükləyərək və istifadə edərək bu İstifadə Şərtlərini qəbul etmiş olursunuz.'
                  : 'By downloading or using Litera, you agree to be bound by these Terms of Service.'}
              </Text>

              {uiLang === 'az' ? (
                <>
                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>1. Xidmətin Təsviri və Məzmun</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    Litera klassik dünya ədəbiyyatı kitablarını oxumaq, daxili tərcümə və tələffüz vasitələrindən istifadə etmək üçün interaktiv platforma təqdim edir. Bütün kitablar ictimai mülkiyyətdə (Public Domain) olan əsərlərdir.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>2. İstifadəçi Məsuliyyəti</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    İstifadəçi xidmətdən yalnız şəxsi təhsil və mütaliə məqsədilə istifadə etməyə və tətbiqin fəaliyyətinə qanunsuz müdaxilə etməməyə razılıq verir.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>3. Abunəlik və Ödənişlər</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    Tətbiqdə limitsiz tərcümə və əlavə funksiyalar üçün Premium abunəliklər təklif oluna bilər. Ödənişlər rəsmi tətbiq mağazası vasitəsilə həyata keçirilir.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>4. Əlaqə</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    Şərtlərlə bağlı suallarınız üçün:
                    {'\n'}📧 <Text style={styles.bold}>support@litera.app</Text>
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>1. Service Description & Content</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    Litera provides an interactive reading platform for classical literature with integrated contextual translation and pronunciation tools. All books available in our catalog are in the Public Domain (e.g. Standard Ebooks, Project Gutenberg).
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>2. User Conduct</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    You agree to use Litera solely for personal, non-commercial reading and language-learning purposes, and refrain from attempting to reverse-engineer or disrupt the service.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>3. Subscriptions & Billing</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    Premium subscriptions provide unlimited instant translations and offline features. Subscriptions are billed and managed securely through the official App Store or Google Play Store billing systems.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>4. Contact Us</Text>
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    For questions regarding these Terms:
                    {'\n'}📧 <Text style={styles.bold}>support@litera.app</Text>
                  </Text>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  contentWrap: {
    gap: Spacing.md,
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 122, 0.3)',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  lastUpdated: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
  },
  paragraph: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  bold: {
    fontWeight: FontWeight.bold,
  },
});
