import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SOCIAL_CONFIG } from '@/lib/social';

let RNShare: any = null;
let RNSocial: any = null;
try {
  const shareModule = require('react-native-share');
  RNShare = shareModule.default;
  RNSocial = shareModule.Social;
} catch (e) {
  // Platform does not support react-native-share in Expo Go, fallback used.
}

export interface QuoteStoryModalProps {
  visible: boolean;
  quote: string;
  bookTitle: string;
  bookAuthor: string;
  bookId: string;
  onClose: () => void;
}

interface Theme {
  id: string;
  name: string;
  colors: [string, string, string];
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
  accent: string;
  quoteMarkColor: string;
}

const THEMES: Theme[] = [
  {
    id: 'obsidian_gold',
    name: 'Obsidian Gold',
    colors: ['#090d16', '#111827', '#030712'],
    cardBg: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(212, 175, 122, 0.35)',
    textColor: '#f8fafc',
    subTextColor: '#d4af7a',
    accent: '#d4af7a',
    quoteMarkColor: '#d4af7a',
  },
  {
    id: 'sunset_glow',
    name: 'Qürub',
    colors: ['#4c0519', '#881337', '#be123c'],
    cardBg: 'rgba(0, 0, 0, 0.2)',
    cardBorder: 'rgba(255, 255, 255, 0.25)',
    textColor: '#ffffff',
    subTextColor: '#fecdd3',
    accent: '#fb7185',
    quoteMarkColor: '#fecdd3',
  },
  {
    id: 'royal_velvet',
    name: 'Bənövşəyi',
    colors: ['#1e1b4b', '#312e81', '#4338ca'],
    cardBg: 'rgba(0, 0, 0, 0.25)',
    cardBorder: 'rgba(255, 255, 255, 0.25)',
    textColor: '#ffffff',
    subTextColor: '#c7d2fe',
    accent: '#818cf8',
    quoteMarkColor: '#c7d2fe',
  },
  {
    id: 'emerald_forest',
    name: 'Zümrüd',
    colors: ['#022c22', '#064e3b', '#065f46'],
    cardBg: 'rgba(0, 0, 0, 0.22)',
    cardBorder: 'rgba(255, 255, 255, 0.22)',
    textColor: '#f0fdf4',
    subTextColor: '#a7f3d0',
    accent: '#34d399',
    quoteMarkColor: '#a7f3d0',
  },
  {
    id: 'warm_parchment',
    name: 'Kağız',
    colors: ['#fef3c7', '#fde68a', '#f59e0b'],
    cardBg: 'rgba(255, 255, 255, 0.45)',
    cardBorder: 'rgba(180, 83, 9, 0.25)',
    textColor: '#451a03',
    subTextColor: '#78350f',
    accent: '#b45309',
    quoteMarkColor: '#b45309',
  },
];

// Exact 9:16 Instagram Story Canvas Dimensions
const STORY_CANVAS_WIDTH = 360;
const STORY_CANVAS_HEIGHT = 640;
const PREVIEW_SCALE = 0.52; // fits nicely on screen
const MAX_STORY_CHARS = 240;

export function QuoteStoryModal({
  visible,
  quote,
  bookTitle,
  bookAuthor,
  bookId,
  onClose,
}: QuoteStoryModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const viewShotRef = useRef<any>(null);

  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Typography & Clamping Calculation for 100% Stability
  const formattedQuote = useMemo(() => {
    let raw = (quote || 'Kitab oxumaq başqa bir dünyada yaşamaqdır.').trim();
    if (raw.length > MAX_STORY_CHARS) {
      raw = raw.slice(0, MAX_STORY_CHARS - 3).trim() + '...';
    }

    const len = raw.length;
    let fontSize = 16;
    let lineHeight = 24;

    if (len <= 75) {
      fontSize = 20;
      lineHeight = 29;
    } else if (len <= 140) {
      fontSize = 16.5;
      lineHeight = 24.5;
    } else if (len <= 195) {
      fontSize = 14;
      lineHeight = 21;
    } else {
      fontSize = 12.5;
      lineHeight = 18;
    }

    return { text: raw, fontSize, lineHeight };
  }, [quote]);

  const deepLink = 'https://litera.app/book/' + (bookId || 'classic');

  async function capture(): Promise<string | null> {
    if (!viewShotRef.current?.capture) return null;
    try {
      return await viewShotRef.current.capture();
    } catch (e) {
      console.log('Capture error:', e);
      return null;
    }
  }

  async function onInstagram() {
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

      if (RNShare && RNSocial && RNSocial.InstagramStories) {
        try {
          await RNShare.shareSingle({
            social: RNSocial.InstagramStories,
            appId: SOCIAL_CONFIG.FACEBOOK_APP_ID,
            backgroundImage: Platform.OS === 'android' ? fileUri : base64Uri,
            attributionURL: deepLink,
          });
          return;
        } catch (igErr: any) {
          if (igErr?.message === 'User did not share' || igErr?.message?.includes('cancel')) return;
        }
      }

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

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'Instagram Story-də Paylaş',
        });
      }
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        setError('Paylaşım xətası baş verdi');
      }
    } finally {
      setBusy(false);
    }
  }

  async function onOtherShare() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const uri = await capture();
      if (!uri) {
        setError('Story şəkli hazırlana bilmədi');
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'Sitatı Paylaş',
        });
      }
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        setError('Paylaşım xətası baş verdi');
      }
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.sm }]}>
          {/* Top Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.brandBadge}>INSTAGRAM 9:16 STORY</Text>
              <Text style={styles.title}>Story Hazırla</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Feather name="x" size={18} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Live 9:16 Story Canvas Preview */}
            <View style={styles.previewContainer}>
              <View
                style={[
                  styles.previewScaleWrap,
                  {
                    width: STORY_CANVAS_WIDTH * PREVIEW_SCALE,
                    height: STORY_CANVAS_HEIGHT * PREVIEW_SCALE,
                  },
                ]}
              >
                <ViewShot
                  ref={viewShotRef}
                  options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
                  style={[
                    styles.fullStoryCanvas,
                    {
                      transform: [
                        { scale: PREVIEW_SCALE },
                        { translateX: -STORY_CANVAS_WIDTH * (1 - PREVIEW_SCALE) },
                        { translateY: -STORY_CANVAS_HEIGHT * (1 - PREVIEW_SCALE) },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={selectedTheme.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.canvasGradient}
                  >
                    {/* Centered Safe-Zone Quote Card (Never Cropped by Instagram) */}
                    <View
                      style={[
                        styles.innerQuoteCard,
                        {
                          backgroundColor: selectedTheme.cardBg,
                          borderColor: selectedTheme.cardBorder,
                        },
                      ]}
                    >
                      {/* Brand Header */}
                      <View style={styles.cardHeader}>
                        <Feather name="book-open" size={12} color={selectedTheme.accent} />
                        <Text style={[styles.cardBrandText, { color: selectedTheme.subTextColor }]}>
                          LITERA
                        </Text>
                      </View>

                      {/* Quote Body */}
                      <View style={styles.quoteBody}>
                        <Text style={[styles.quoteMark, { color: selectedTheme.quoteMarkColor }]}>
                          “
                        </Text>
                        <Text
                          style={[
                            styles.quoteText,
                            {
                              color: selectedTheme.textColor,
                              fontSize: formattedQuote.fontSize,
                              lineHeight: formattedQuote.lineHeight,
                            },
                          ]}
                        >
                          {formattedQuote.text}
                        </Text>
                      </View>

                      {/* Card Footer */}
                      <View style={styles.cardFooter}>
                        <View style={styles.cardMeta}>
                          <Text
                            numberOfLines={1}
                            style={[styles.bookTitleText, { color: selectedTheme.textColor }]}
                          >
                            {bookTitle || 'Kitab'}
                          </Text>
                          {bookAuthor ? (
                            <Text
                              numberOfLines={1}
                              style={[styles.authorText, { color: selectedTheme.subTextColor }]}
                            >
                              {bookAuthor}
                            </Text>
                          ) : null}
                        </View>

                        <View style={[styles.sealBadge, { borderColor: selectedTheme.accent }]}>
                          <Text style={[styles.sealText, { color: selectedTheme.accent }]}>L</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </ViewShot>
              </View>
            </View>

            {/* Theme Selector */}
            <Text style={styles.sectionLabel}>Rəng Teması</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.themeScroll}
            >
              {THEMES.map((th) => {
                const active = th.id === selectedTheme.id;
                return (
                  <Pressable
                    key={th.id}
                    onPress={() => setSelectedTheme(th)}
                    style={({ pressed }) => [
                      styles.themeCard,
                      active && styles.themeCardActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <LinearGradient
                      colors={th.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.themeSwatch}
                    />
                    <Text style={[styles.themeLabel, active && styles.themeLabelActive]}>
                      {th.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.bottomActionRow}>
            <Pressable
              onPress={onInstagram}
              disabled={busy}
              style={({ pressed }) => [
                styles.igBtn,
                pressed && styles.pressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#0d0f17" />
              ) : (
                <>
                  <Feather name="camera" size={16} color="#0d0f17" style={{ marginRight: 6 }} />
                  <Text style={styles.igBtnText}>Instagram Story</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={onOtherShare}
              disabled={busy}
              style={({ pressed }) => [
                styles.otherBtn,
                pressed && styles.pressed,
              ]}
            >
              <Feather name="share-2" size={16} color="#f8fafc" style={{ marginRight: 6 }} />
              <Text style={styles.otherBtnText}>Paylaş / Saxla</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#0d0f17',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 122, 0.25)',
    maxHeight: '90%',
    paddingTop: Spacing.xs,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  headerTitleWrap: {
    gap: 2,
  },
  brandBadge: {
    color: '#d4af7a',
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.2,
  },
  title: {
    color: '#f8fafc',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  previewScaleWrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  fullStoryCanvas: {
    width: STORY_CANVAS_WIDTH,
    height: STORY_CANVAS_HEIGHT,
  },
  canvasGradient: {
    flex: 1,
    paddingHorizontal: 25,
    paddingVertical: 70, // generous safe margins for Instagram UI
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerQuoteCard: {
    width: '100%',
    minHeight: 280,
    maxHeight: 460,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardBrandText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },
  quoteBody: {
    paddingVertical: 14,
  },
  quoteMark: {
    fontSize: 36,
    lineHeight: 36,
    fontFamily: 'serif',
    marginBottom: -8,
  },
  quoteText: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardMeta: {
    flex: 1,
    marginRight: 8,
  },
  bookTitleText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  authorText: {
    fontSize: 10.5,
    marginTop: 2,
  },
  sealBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  themeScroll: {
    gap: 10,
    paddingVertical: Spacing.xs,
  },
  themeCard: {
    alignItems: 'center',
    backgroundColor: '#12151f',
    borderRadius: Radius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    width: 80,
  },
  themeCardActive: {
    borderColor: '#d4af7a',
    borderWidth: 1.5,
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
  },
  themeSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 6,
  },
  themeLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  themeLabelActive: {
    color: '#d4af7a',
    fontWeight: FontWeight.bold,
  },
  errorBanner: {
    color: '#ef4444',
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  bottomActionRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0d0f17',
    gap: 10,
  },
  igBtn: {
    flex: 1.2,
    backgroundColor: '#d4af7a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  igBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  otherBtn: {
    flex: 1,
    backgroundColor: '#191e2e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  otherBtnText: {
    color: '#f8fafc',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
