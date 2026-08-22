import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Feather } from '@expo/vector-icons';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SOCIAL_CONFIG } from '@/lib/social';
import { useAppTheme } from '@/lib/theme';
import type { ApiBook } from '@/types/book';

// react-native-share
let RNShare: any = null;
let RNSocial: any = null;
try {
  const shareModule = require('react-native-share');
  RNShare = shareModule.default;
  RNSocial = shareModule.Social;
} catch (e) {}

export interface BookStoryModalProps {
  visible: boolean;
  book: ApiBook | null;
  onClose: () => void;
}

const STORY_ASPECT = 9 / 16;
const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 280);
const PREVIEW_HEIGHT = PREVIEW_WIDTH / STORY_ASPECT;

export function BookStoryModal({ visible, book, onClose }: BookStoryModalProps) {
  const viewShotRef = useRef<any>(null);
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!book) return null;

  async function capture(): Promise<string | null> {
    if (!viewShotRef.current?.capture) return null;
    try {
      return await viewShotRef.current.capture();
    } catch (e) {
      return null;
    }
  }

  async function onShareInstagram() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const uri = await capture();
      if (!uri) {
        setError('Story şəkli hazırlana bilmədi');
        return;
      }

      let fileUri = uri.startsWith('file://') ? uri : 'file://' + uri;
      let base64Image = '';
      try {
        base64Image = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch {}

      const base64Uri = base64Image ? `data:image/png;base64,${base64Image}` : fileUri;

      // Direct Instagram Stories attempt
      if (RNShare && RNSocial && RNSocial.InstagramStories) {
        try {
          const shareOptions: any = {
            social: RNSocial.InstagramStories,
            appId: SOCIAL_CONFIG.FACEBOOK_APP_ID,
            backgroundImage: Platform.OS === 'android' ? fileUri : base64Uri,
            backgroundTopColor: '#0a0a19',
            backgroundBottomColor: '#000000',
            attributionURL: SOCIAL_CONFIG.getBookUrl(book?.id || ''),
          };
          await RNShare.shareSingle(shareOptions);
          return;
        } catch (igErr: any) {
          // If user cancelled or direct single share failed, fallback smoothly
          if (igErr?.message === 'User did not share' || igErr?.message?.includes('cancel')) {
            return;
          }
        }
      }

      // High-reliability Fallback: Native system share sheet with Instagram target
      if (RNShare) {
        try {
          await RNShare.open({
            url: Platform.OS === 'android' ? fileUri : base64Uri,
            type: 'image/png',
            title: 'Instagram Story-də Paylaş',
            failOnCancel: false,
          });
          return;
        } catch {}
      }

      // Expo sharing fallback
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Instagram Story-də Paylaş',
          UTI: 'public.png',
        });
      }
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        setError(err instanceof Error ? err.message : 'Paylaşım xətası');
      }
    } finally {
      setBusy(false);
    }
  }

  async function onShareOther() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const uri = await capture();
      if (!uri) {
        setError('Story şəkli hazırlana bilmədi');
        return;
      }

      let fileUri = uri.startsWith('file://') ? uri : 'file://' + uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Kitabı paylaş',
          UTI: 'public.png',
        });
      }
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        setError(err instanceof Error ? err.message : 'Paylaşım xətası');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.heading, { color: colors.text }]}>Story Kimi Paylaş</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Story Visual 9:16 Canvas */}
          <View style={styles.previewContainer}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
              style={[styles.storyCanvas, { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }]}
            >
              {/* Background Cover Image */}
              {book.coverUrl ? (
                <Image
                  source={{ uri: book.coverUrl }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1e1b4b' }]} />
              )}

              {/* Bottom to Top Dark Fade Gradient Overlay */}
              <LinearGradient
                colors={[
                  'rgba(10, 10, 25, 0.15)',
                  'rgba(10, 10, 25, 0.45)',
                  'rgba(5, 5, 15, 0.88)',
                  '#000000',
                ]}
                locations={[0, 0.45, 0.75, 1]}
                style={StyleSheet.absoluteFill}
              />

              {/* Top Branding Badge: Litera */}
              <View style={styles.storyTopBrand}>
                <View style={styles.brandIconWrapper}>
                  <Text style={styles.brandIconLetter}>L</Text>
                </View>
                <Text style={styles.brandNameText}>Litera</Text>
              </View>

              {/* Bottom Content Area */}
              <View style={styles.storyBottomContent}>
                <Text style={styles.storyBookTitle} numberOfLines={2}>
                  {book.title}
                </Text>

                <Text style={styles.storyBookAuthor} numberOfLines={1}>
                  {book.author || 'Klassik Ədəbiyyat'}
                </Text>

                {/* Call to Action Badge: "Elə indi Litera ilə oxu" */}
                <View style={styles.ctaBadge}>
                  <Feather name="book-open" size={12} color="#ffffff" style={{ marginRight: 5 }} />
                  <Text style={styles.ctaBadgeText}>Elə indi Litera ilə oxu</Text>
                </View>

                {/* Watermark / Deep Link */}
                <Text style={styles.watermarkText}>litera://book/{book.id}</Text>
              </View>
            </ViewShot>
          </View>

          {/* Error message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Action Buttons */}
          <View style={styles.actionsWrapper}>
            {/* 1. Direct Instagram Stories Share */}
            <Pressable
              style={({ pressed }) => [styles.instagramBtn, pressed && styles.pressed, busy && styles.disabled]}
              onPress={onShareInstagram}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Feather name="camera" size={18} color="#ffffff" />
                  <Text style={styles.instagramBtnText}>Instagram Story-də Paylaş</Text>
                </>
              )}
            </Pressable>

            {/* 2. Other Share Options (WhatsApp, Telegram, AirDrop, etc.) */}
            <Pressable
              style={({ pressed }) => [
                styles.otherBtn,
                { backgroundColor: colors.surfaceBorder },
                pressed && styles.pressed,
                busy && styles.disabled,
              ]}
              onPress={onShareOther}
              disabled={busy}
            >
              <Feather name="share" size={18} color={colors.text} />
              <Text style={[styles.otherBtnText, { color: colors.text }]}>Digər Tətbiqlərdə Paylaş</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  heading: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  previewContainer: {
    marginVertical: Spacing.xs,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  storyCanvas: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  storyTopBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconLetter: {
    color: '#1a1b3a',
    fontSize: 13,
    fontWeight: FontWeight.bold,
  },
  brandNameText: {
    color: '#ffffff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyBottomContent: {
    alignItems: 'flex-start',
  },
  storyBookTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storyBookAuthor: {
    color: '#d4af7a',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    marginBottom: 8,
  },
  ctaBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  watermarkText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  actionsWrapper: {
    width: '100%',
    marginTop: Spacing.lg,
    gap: 10,
  },
  instagramBtn: {
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: '#e1306c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#e1306c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  instagramBtnText: {
    color: '#ffffff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  otherBtn: {
    height: 44,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  otherBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  errorText: {
    color: '#ef4444',
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
});
