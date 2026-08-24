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

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>1. Toplanan Məlumatlar</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                • <Text style={styles.bold}>Lokal Məlumatlar:</Text> Yadda saxladığınız sözlər, oxuma tərəqqiniz, şrift və tema parametrləri cihazınızın daxili yaddaşında (SQLite & AsyncStorage) saxlanılır.
                {'\n'}• <Text style={styles.bold}>Hesab Məlumatları (Könüllü):</Text> Qeydiyyatdan keçdiyiniz halda e-poçt ünvanınız və istifadəçi adınız Supabase bulud bazasında cihazlararası sinxronizasiya üçün saxlanılır.
                {'\n'}• <Text style={styles.bold}>Anonim Analitika:</Text> Tətbiqin çökməsinin qarşısını almaq və sabitliyini artırmaq üçün yalnız texniki xəta loqları qeydə alına bilər.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>2. Məlumatların İstifadə Məqsədi</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Toplanan məlumatlar yalnız aşağıdakı məqsədlər üçün istifadə olunur:
                {'\n'}• Oxuma prosesinizi və lüğətinizi cihazlarınız arasında sinxronlaşdırmaq;
                {'\n'}• Tərcümə və tələffüz xidmətlərini operativ təmin etmək;
                {'\n'}• Lüğət oyunları və test statistikalarınızı hesablamaq.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>3. Reklam və Üçüncü Tərəf Xidmətləri</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Tətbiqimiz pulsuz istifadəçilər üçün Google AdMob reklam şəbəkəsindən istifadə edir. Google AdMob fərdiləşdirilmiş və ya ümumi reklamlar göstərmək üçün anonim cihaz identifikatorlarından istifadə edə bilər. İstifadəçi istədiyi zaman Premium abunəlik ilə bütün reklamları tamamilə söndürə bilər.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>4. Hesabın və Məlumatların Silinməsi Hüququ</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Google Play qaydalarına uyğun olaraq, istifadəçi istənilən vaxt <Text style={styles.bold}>Ayarlar → Hesabı Sil</Text> bölməsindən öz hesabını, bütün bulud məlumatlarını və cihazdakı qeydlərini birdəfəlik və dərhal silmək hüququna malikdir.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>5. Əlaqə</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Məxfilik siyasəti ilə bağlı hər hansı sualınız və ya təklifiniz olarsa, bizimlə əlaqə saxlaya bilərsiniz:
                {'\n'}📧 <Text style={styles.bold}>contact@litera.app</Text>
              </Text>
            </View>
          ) : (
            /* ================= TERMS OF SERVICE ================= */
            <View style={styles.contentWrap}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(212, 175, 122, 0.15)' }]}>
                <Text style={[styles.badgeText, { color: '#d4af7a' }]}>Litera App • İstifadə Şərtləri</Text>
              </View>

              <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
                Son Yenilənmə: 24 Avqust 2026
              </Text>

              <Text style={[styles.paragraph, { color: colors.text }]}>
                <Text style={styles.bold}>Litera</Text> tətbiqini yükləyərək və istifadə edərək bu İstifadə Şərtlərini qəbul etmiş olursunuz.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>1. Xidmətin Təsviri və Məzmun</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Litera istifadəçilərə klassik dünya ədəbiyyatı kitablarını oxumaq, daxili tərcümə və tələffüz vasitələrindən istifadə etmək və lüğət ehtiyatını inkişaf etdirmək üçün interaktiv platforma təqdim edir.
                {'\n'}• Tətbiqdə təqdim olunan bütün kitablar ictimai mülkiyyətdə (Public Domain - Standard Ebooks / Project Gutenberg) olan əsərlərdir.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>2. İstifadəçi Məsuliyyəti</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                İstifadəçi hesabının təhlükəsizliyini qorumağa, tətbiqin fəaliyyətinə qanunsuz müdaxilə etməməyə və xidmətdən yalnız şəxsi təhsil və mütaliə məqsədilə istifadə etməyə razılıq verir.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>3. Abunəlik və Ödənişlər</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Tətbiqdə limitsiz tərcümə və reklamsız oxu təcrübəsi üçün Premium abunəliklər təklif oluna bilər. Bütün ödənişlər Google Play Store-un rəsmi ödəniş sistemi vasitəsilə təhlükəsiz həyata keçirilir və Google Play abunəlik idarəetmə qaydalarına tabedir.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>4. Dəyişikliklər</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Litera xidmətləri inkişaf etdirmək məqsədilə istifadə şərtlərini yeniləmək hüququnu özündə saxlayır. Yenilənmiş şərtlər tətbiqdə dərc edildiyi andan qüvvəyə minir.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>5. Əlaqə</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Şərtlərlə bağlı suallarınız üçün:
                {'\n'}📧 <Text style={styles.bold}>support@litera.app</Text>
              </Text>
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
