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
  const title = isPrivacy ? t('privacy_policy') : t('terms_of_service');

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
                <Text style={[styles.badgeText, { color: '#d4af7a' }]}>
                  Litera • Privacy Policy
                </Text>
              </View>

              <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
                Last Updated: October 2026
              </Text>

              <Text style={[styles.paragraph, { color: colors.text }]}>
                <Text style={styles.bold}>Litera</Text> ("we", "our", or "us") is committed to protecting your privacy and personal data. This Privacy Policy outlines the types of information we collect, how it is used, and the steps we take to safeguard your data.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>1. Information We Collect</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                • <Text style={styles.bold}>Account Information (Optional):</Text> If you choose to create an account, we collect your email address and display name to enable cross-device synchronization of your library and vocabulary.
                {'\n'}• <Text style={styles.bold}>Reading & Learning Progress:</Text> Your saved vocabulary words, reading milestones, and practice statistics are stored securely on your device and synchronized with your private account if signed in.
                {'\n'}• <Text style={styles.bold}>Device & Diagnostic Data:</Text> Non-identifying technical and diagnostic information may be processed solely to ensure application stability and performance.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>2. How We Use Your Information</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                We use collected information strictly to:
                {'\n'}• Provide digital reading, dictionary lookup, and vocabulary practice features;
                {'\n'}• Synchronize your reading progress across your authenticated devices;
                {'\n'}• Maintain application performance, security, and stability.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>3. Third-Party Services</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                We partner with trusted third-party services conforming to industry privacy standards:
                {'\n'}• <Text style={styles.bold}>Google Mobile Ads (AdMob):</Text> Serves non-personalized or contextual advertisements in compliance with Google Play Developer policies.
                {'\n'}• <Text style={styles.bold}>Google Play Billing:</Text> Securely processes optional in-app subscriptions without sharing your financial details with us.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>4. Data Security</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                We implement industry-standard encryption protocols (TLS/HTTPS) for all data in transit. Stored data is protected by strict access controls ensuring that only authenticated users can access their own information.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>5. Account & Data Deletion</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                You retain complete control over your data. You may permanently delete your account and all associated cloud and local data at any time via <Text style={styles.bold}>Settings → Delete Account</Text>, or submit an online deletion request via our support channels.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>6. Children's Privacy</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Litera does not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us for immediate deletion.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>7. Contact Us</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                If you have questions regarding this Privacy Policy, please contact us at:
                {'\n'}📧 <Text style={styles.bold}>support@litera.app</Text>
              </Text>
            </View>
          ) : (
            /* ================= TERMS OF SERVICE ================= */
            <View style={styles.contentWrap}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(212, 175, 122, 0.15)' }]}>
                <Text style={[styles.badgeText, { color: '#d4af7a' }]}>Litera • Terms of Service</Text>
              </View>

              <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
                Last Updated: October 2026
              </Text>

              <Text style={[styles.paragraph, { color: colors.text }]}>
                By downloading, accessing, or using Litera, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>1. Service Description</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Litera is an interactive digital reading platform providing access to classic public-domain literature, contextual translation tools, and vocabulary exercises. All book texts provided are in the public domain.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>2. User Conduct & Fair Use</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                You agree to use the service exclusively for personal, non-commercial reading and educational purposes. You agree not to reverse-engineer, disrupt, or misuse our services or networks.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>3. Subscriptions & Billing</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Litera provides free reading supported by optional rewarded videos. Optional Premium subscriptions provide unlimited translations and an ad-free experience. All purchases and subscriptions are handled securely through Google Play Billing and are subject to Google Play standard terms and refund policies.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>4. Disclaimer of Warranties</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                The application and its content are provided on an "as-is" and "as-available" basis without warranties of any kind, whether express or implied.
              </Text>

              <Text style={[styles.sectionHeading, { color: '#d4af7a' }]}>5. Contact Us</Text>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                For questions regarding these Terms of Service:
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
