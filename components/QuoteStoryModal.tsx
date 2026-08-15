import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
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

// react-native-share yalniz development build-de isleyir, Expo Go-da yox.
let RNShare: any = null;
let RNSocial: any = null;
try {
  const shareModule = require('react-native-share');
  RNShare = shareModule.default;
  RNSocial = shareModule.Social;
} catch (e) {
  // Platforma desteklemir, fallback istifade olunacaq.
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
  textColor: string;
  subTextColor: string;
  accent: string;
}

const THEMES: Theme[] = [
  {
    id: 'sunset',
    name: 'Gun eshi',
    colors: ['#fb7185', '#f97316', '#facc15'],
    textColor: '#ffffff',
    subTextColor: 'rgba(255,255,255,0.85)',
    accent: '#ffffff',
  },
  {
    id: 'ocean',
    name: 'Okean',
    colors: ['#0ea5e9', '#6366f1', '#8b5cf6'],
    textColor: '#ffffff',
    subTextColor: 'rgba(255,255,255,0.85)',
    accent: '#ffffff',
  },
  {
    id: 'forest',
    name: 'Mese',
    colors: ['#064e3b', '#065f46', '#10b981'],
    textColor: '#f0fdf4',
    subTextColor: 'rgba(240,253,244,0.8)',
    accent: '#bbf7d0',
  },
  {
    id: 'paper',
    name: 'Kagiz',
    colors: ['#fef9c3', '#fde68a', '#fcd34d'],
    textColor: '#1a1a1a',
    subTextColor: 'rgba(26,26,26,0.7)',
    accent: '#92400e',
  },
];

const STORY_ASPECT = 9 / 16;
const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 320);
const PREVIEW_HEIGHT = PREVIEW_WIDTH / STORY_ASPECT;

// Instagram Facebook Developer app-id sahesidir. Production build-de
// real app-id ile deyisilmelidir.
const INSTAGRAM_APP_ID = '123456789';

export function QuoteStoryModal({
  visible,
  quote,
  bookTitle,
  bookAuthor,
  bookId,
  onClose,
}: QuoteStoryModalProps) {
  const viewShotRef = useRef<any>(null);
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deepLink = 'kitapapp://book/' + bookId;

  async function capture(): Promise<string | null> {
    if (!viewShotRef.current?.capture) return null;
    try {
      return await viewShotRef.current.capture();
    } catch (e) {
      console.log('Capture xetasi:', e);
      return null;
    }
  }

  // Instagram Stories-in paylashilmasi üçün
  // react-native-share və ya deep link fallback mexanizmindən istifadə olunur.
  async function onInstagram() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const uri = await capture();
      if (!uri) {
        setError('Story hazirlana bilmedi');
        return;
      }

      let fileUri = uri;
      if (!fileUri.startsWith('file://')) {
        fileUri = 'file://' + fileUri;
      }

      let base64Image = '';
      try {
        base64Image = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (e) {
        console.log('Base64 read error:', e);
      }

      const base64Uri = base64Image ? `data:image/png;base64,${base64Image}` : fileUri;

      if (RNShare) {
        if (RNSocial && RNSocial.InstagramStories) {
          try {
            await RNShare.shareSingle({
              social: RNSocial.InstagramStories,
              appId: INSTAGRAM_APP_ID,
              backgroundImage: fileUri,
              attributionURL: deepLink,
            });
            return;
          } catch (igErr: any) {
            if (igErr?.message === 'User did not share' || igErr?.message?.includes('cancel')) return;
            console.log('IG Stories shareSingle error:', igErr);
          }
        }

        if (RNSocial && RNSocial.Instagram) {
          try {
            await RNShare.shareSingle({
              social: RNSocial.InstagramStories,
              backgroundImage: fileUri,
              attributionURL: deepLink,
            });
            return;
          } catch (igErr: any) {
            if (igErr?.message === 'User did not share' || igErr?.message?.includes('cancel')) return;
            console.log('IG direct shareSingle error:', igErr);
          }
        }
      }

      // System share sheet (opens Instagram, WhatsApp, Stories etc.)
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: 'Instagram Stories-də paylaş',
      });
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        console.log('IG share overall error:', err);
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
        setError('Story hazirlana bilmedi');
        return;
      }
      if (RNShare) {
        await RNShare.open({
          url: uri,
          type: 'image/png',
          filename: 'kitapapp-story.png',
          title: 'KitapApp-den sitat',
          message: quoteText(quote, bookTitle, bookAuthor, deepLink),
          failOnCancel: false,
        });
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'Sitata paylash',
        });
      }
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        console.log('Share xetasi:', err);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Story hazirla</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Text style={styles.closeBtnText}>x</Text>
            </Pressable>
          </View>

          <View style={styles.previewWrap}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
              style={[styles.shot, { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }]}
            >
              <LinearGradient
                colors={theme.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.brandTopRow}>
                  <Text style={[styles.brandText, { color: theme.subTextColor }]}>
                    KitapApp ile oxundu
                  </Text>
                </View>

                <View style={styles.quoteWrap}>
                  <Text
                    style={[styles.quoteMark, { color: theme.accent, opacity: 0.5 }]}
                  >
                    "
                  </Text>
                  <Text
                    style={[styles.quoteText, { color: theme.textColor }]}
                  >
                    {quote}
                  </Text>
                </View>

                <View style={styles.bottomRow}>
                  <View style={styles.metaCol}>
                    <Text
                      numberOfLines={1}
                      style={[styles.bookTitle, { color: theme.textColor }]}
                    >
                      {bookTitle}
                    </Text>
                    {bookAuthor ? (
                      <Text
                        numberOfLines={1}
                        style={[styles.authorText, { color: theme.subTextColor }]}
                      >
                        {bookAuthor}
                      </Text>
                    ) : null}
                    <Text
                      numberOfLines={1}
                      style={[styles.linkText, { color: theme.subTextColor }]}
                    >
                      {deepLink}
                    </Text>
                  </View>
                  <View
                    style={[styles.appBadge, { borderColor: theme.accent }]}
                  >
                    <Text style={[styles.appBadgeText, { color: theme.accent }]}>
                      K
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </ViewShot>
          </View>

          <Text style={styles.sectionLabel}>Tema</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themesRow}
          >
            {THEMES.map((item) => {
              const active = item.id === theme.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setTheme(item)}
                  style={({ pressed }) => [
                    styles.themeChip,
                    active && styles.themeChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.themeSwatch}
                  />
                  <Text
                    style={[styles.themeName, active && styles.themeNameActive]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.shareButtonsRow}>
            <Pressable
              onPress={onInstagram}
              disabled={busy || !quote.trim()}
              style={({ pressed }) => [
                styles.shareBtn,
                styles.shareBtnIg,
                (busy || !quote.trim()) && styles.shareBtnDisabled,
                pressed && styles.pressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.shareBtnTextIg}>IG Story</Text>
              )}
            </Pressable>

            <Pressable
              onPress={onOtherShare}
              disabled={busy || !quote.trim()}
              style={({ pressed }) => [
                styles.shareBtn,
                styles.shareBtnOther,
                (busy || !quote.trim()) && styles.shareBtnDisabled,
                pressed && styles.pressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#0f172a" size="small" />
              ) : (
                <Text style={styles.shareBtnTextOther}>Diger</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function quoteText(
  quote: string,
  title: string,
  author: string,
  link: string,
): string {
  const parts = [
    '"' + quote + '"',
    title && ' - ' + title,
    author && ' / ' + author,
    link,
    '\nKitapApp ile oxundu',
  ].filter(Boolean);
  return parts.join('\n');
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  pressed: {
    opacity: 0.7,
  },
  previewWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  shot: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
  },
  brandTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  brandText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  quoteWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  quoteMark: {
    fontSize: 56,
    lineHeight: 56,
    fontWeight: '700',
  },
  quoteText: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
    fontFamily: 'Georgia, serif',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  authorText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  linkText: {
    fontSize: 9,
    marginTop: 4,
    opacity: 0.8,
  },
  appBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBadgeText: {
    fontWeight: '800',
    fontSize: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themesRow: {
    gap: 10,
    paddingVertical: 4,
  },
  themeChip: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  themeChipActive: {
    transform: [{ scale: 1.05 }],
  },
  themeSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  themeName: {
    fontSize: 11,
    color: '#64748b',
  },
  themeNameActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  shareButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnIg: {
    backgroundColor: '#0f172a',
  },
  shareBtnOther: {
    backgroundColor: '#e2e8f0',
  },
  shareBtnDisabled: {
    opacity: 0.5,
  },
  shareBtnTextIg: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  shareBtnTextOther: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 15,
  },
});
