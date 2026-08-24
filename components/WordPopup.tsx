import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

import { useAuth } from "@/lib/auth/AuthContext";
import { FontSize, FontWeight, Radius, Spacing } from "@/lib/design";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { syncWordToCloud } from "@/lib/sync/sync-service";
import {
  getPronunciationCached,
  type PronunciationResult,
} from "@/lib/pronunciation";
import { translateWord, type TranslationResult } from "@/lib/translation";
import { isWordSaved, saveWord } from "@/lib/vocabulary/store";
import { getAudioDataUrl } from "@/lib/audio";

export interface WordPopupProps {
  visible: boolean;
  word: string | null;
  sentenceContext?: string | null;
  onClose: () => void;
  onMakeStory?: (text: string) => void;
}

type LoadState = "loading" | "ready" | "error";

const SILENT_PLAYER_HTML = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;padding:0;background:transparent;"></body>
</html>`;

function buildPlayerHtml(audioUrl: string, autoplay: boolean): string {
  const safeUrl = audioUrl.replace(/"/g, "&quot;");
  const auto = autoplay ? "true" : "false";
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body style="margin:0;padding:0;background:transparent;">
    <audio id="player" src="${safeUrl}" preload="auto" playsinline webkit-playsinline></audio>
    <script>
      (function() {
        var p = document.getElementById("player");
        var autoplayFlag = ${auto};

        function send(m) {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(m);
            }
          } catch(e){}
        }

        if (!p) return;

        p.addEventListener("ended", function () { send("ended"); });
        p.addEventListener("error", function () { send("error"); });
        p.addEventListener("abort", function () { send("error"); });

        function tryPlay() {
          if (autoplayFlag) {
            p.play().then(function() {
              send("playing");
            }).catch(function() {
              setTimeout(function() {
                p.play().catch(function() { send("error"); });
              }, 250);
            });
          }
        }

        if (p.readyState >= 2) {
          tryPlay();
        } else {
          p.addEventListener("canplaythrough", tryPlay, { once: true });
          p.addEventListener("loadedmetadata", tryPlay, { once: true });
        }

        setTimeout(function () {
          if (autoplayFlag && p.paused && p.currentTime === 0) {
            send("error");
          }
        }, 6000);
      })();
    </script>
  </body>
</html>`;
}

export function WordPopup({
  visible,
  word,
  sentenceContext,
  onClose,
}: WordPopupProps) {
  const { targetLang, t } = useLanguage();
  const { user } = useAuth();

  const [pronunciation, setPronunciation] = useState<PronunciationResult | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [pronState, setPronState] = useState<LoadState>("loading");
  const [transState, setTransState] = useState<LoadState>("loading");

  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [saved, setSaved] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const [sentenceTrans, setSentenceTrans] = useState<string | null>(null);
  const [loadingSentenceTrans, setLoadingSentenceTrans] = useState(false);

  useEffect(() => {
    setSentenceTrans(null);
    setLoadingSentenceTrans(false);

    if (!visible || !word) {
      setPronunciation(null);
      setTranslation(null);
      setPronState("loading");
      setTransState("loading");
      setAudioDataUrl(null);
      setSaved(false);
      setAudioError(false);
      setIsSpeaking(false);
      setAudioLoading(false);
      return;
    }

    let isMounted = true;
    const cleanWord = word.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");

    isWordSaved(cleanWord, targetLang)
      .then((isSavedResult) => {
        if (isMounted) setSaved(isSavedResult);
      })
      .catch(() => {});

    setPronState("loading");
    getPronunciationCached(cleanWord)
      .then((res) => {
        if (!isMounted) return;
        setPronunciation(res);
        setPronState("ready");
      })
      .catch(() => {
        if (isMounted) setPronState("error");
      });

    setTransState("loading");
    translateWord(cleanWord, targetLang)
      .then((res) => {
        if (!isMounted) return;
        setTranslation(res);
        setTransState("ready");
      })
      .catch(() => {
        if (isMounted) setTransState("error");
      });

    getAudioDataUrl(cleanWord)
      .then((dataUrl) => {
        if (!isMounted) return;
        setAudioDataUrl(dataUrl);
        setPlayerKey((k) => k + 1);
        if (dataUrl) {
          setAutoPlay(true);
        } else {
          setAudioError(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAudioDataUrl(null);
          setAudioError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [visible, word, targetLang]);

  const loadSentenceTranslation = useCallback(async () => {
    if (!sentenceContext || loadingSentenceTrans || sentenceTrans) return;
    setLoadingSentenceTrans(true);
    try {
      const res = await translateWord(sentenceContext, targetLang);
      setSentenceTrans(res?.translated || "Tərcümə alına bilmədi.");
    } catch {
      setSentenceTrans("Tərcümə alına bilmədi.");
    } finally {
      setLoadingSentenceTrans(false);
    }
  }, [sentenceContext, loadingSentenceTrans, sentenceTrans, targetLang]);

  const onPlayPress = useCallback(() => {
    if (audioDataUrl && !audioError) {
      setAutoPlay(true);
      setPlayerKey((k) => k + 1);
    } else if (word) {
      setIsSpeaking(true);
      Speech.speak(word, {
        language: 'en-US',
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  }, [audioDataUrl, audioError, word]);

  const onPlayerMessage = useCallback((event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;
    if (data === "playing") {
      setIsSpeaking(true);
    } else if (data === "ended") {
      setIsSpeaking(false);
    } else if (data === "error") {
      setIsSpeaking(false);
      setAudioError(true);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!word) return;
    try {
      const input = {
        word,
        translation: translation?.translated ?? null,
        phonetic: pronunciation?.phonetic ?? null,
        language: targetLang,
      };
      await saveWord(input);
      setSaved(true);
      if (user?.id) {
        syncWordToCloud(user.id, input).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [word, translation, pronunciation, targetLang, user?.id]);

  const showOnlinePlayer = audioDataUrl !== null;
  const playerHtml =
    showOnlinePlayer && autoPlay
      ? buildPlayerHtml(audioDataUrl, true)
      : SILENT_PLAYER_HTML;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Glowing Gold Border Luxury Charcoal Card */}
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Header: Word + Audio + Close */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.word} numberOfLines={2}>
                {word ?? ""}
              </Text>
            </View>

            {/* Glowing Golden Audio Speaker Button */}
            <Pressable
              onPress={onPlayPress}
              style={({ pressed }) => [
                styles.audioIconBtn,
                pressed && styles.pressed,
              ]}
              hitSlop={10}
            >
              <Feather name="volume-2" size={18} color="#d4af7a" />
            </Pressable>

            {/* Close Button */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
              hitSlop={10}
            >
              <Feather name="x" size={18} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Phonetic & Meaning Section */}
          <View style={styles.section}>
            {pronState === "loading" ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#d4af7a" size="small" />
                <Text style={styles.mutedText}>  {t('loading')}</Text>
              </View>
            ) : pronState === "error" || !pronunciation ? (
              <Text style={styles.mutedText}>{t('no_definition')}</Text>
            ) : (
              <View style={styles.pronBlock}>
                <View style={styles.badgeRow}>
                  {pronunciation.phonetic ? (
                    <Text style={styles.phonetic}>{pronunciation.phonetic}</Text>
                  ) : null}

                  {pronunciation.meanings[0]?.partOfSpeech ? (
                    <View style={styles.posBadge}>
                      <Text style={styles.posText}>
                        {pronunciation.meanings[0].partOfSpeech}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {pronunciation.meanings.slice(0, 1).map((meaning, idx) => (
                  <View key={idx} style={styles.meaningBlock}>
                    <Text style={styles.definition}>{meaning.definition}</Text>
                    {meaning.example ? (
                      <View style={styles.exampleBox}>
                        <Text style={styles.exampleLabel}>{t('example_label')}:</Text>
                        <Text style={styles.example}>"{meaning.example}"</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Golden Divider */}
          <View style={styles.goldDivider} />

          {/* Translation Box Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('translation_header')}</Text>

            {transState === "loading" ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#d4af7a" size="small" />
                <Text style={styles.mutedText}>  {t('translating')}</Text>
              </View>
            ) : transState === "error" || !translation ? (
              <Text style={styles.mutedText}>{t('no_translation')}</Text>
            ) : (
              <View style={styles.translationContainer}>
                <Text style={styles.translationText}>{translation.translated}</Text>
              </View>
            )}
          </View>

          {/* Sentence Context (Active Action Button & Result) */}
          {sentenceContext ? (
            <View style={styles.sentenceWrap}>
              <Pressable
                onPress={loadSentenceTranslation}
                disabled={loadingSentenceTrans}
                style={({ pressed }) => [
                  styles.sentenceBtn,
                  pressed && styles.pressed,
                ]}
              >
                {loadingSentenceTrans ? (
                  <>
                    <ActivityIndicator size="small" color="#d4af7a" />
                    <Text style={styles.sentenceBtnText}>
                      {t('translating_sentence')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Feather name="file-text" size={14} color="#d4af7a" />
                    <Text style={styles.sentenceBtnText}>
                      {t('translate_sentence_btn')}
                    </Text>
                  </>
                )}
              </Pressable>
              {sentenceTrans ? (
                <View style={styles.sentenceResultBox}>
                  <Text style={styles.sentenceResultText}>"{sentenceTrans}"</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Bottom Save Action CTA (Golden Warm Elegance) */}
          <Pressable
            onPress={handleSave}
            disabled={saved || !word}
            style={({ pressed }) => [
              styles.saveBtn,
              saved && styles.savedBtn,
              pressed && styles.pressed,
            ]}
          >
            <Feather
              name={saved ? "check" : "bookmark"}
              size={17}
              color={saved ? "#d4af7a" : "#0d0f17"}
            />
            <Text style={[styles.saveBtnText, saved && styles.savedBtnText]}>
              {saved ? t('word_saved') : t('add_to_vocab')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>

      {/* Hidden Audio WebView */}
      {showOnlinePlayer ? (
        <View style={styles.hiddenPlayer}>
          <WebView
            key={playerKey}
            ref={webViewRef}
            source={{ html: playerHtml }}
            onMessage={onPlayerMessage}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            javaScriptEnabled={true}
          />
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#10131d",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#d4af7a",
    padding: Spacing.xl,
    shadowColor: "#d4af7a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.md,
  },
  word: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  audioIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(212, 175, 122, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 122, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: Spacing.md,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  mutedText: {
    color: "#94a3b8",
    fontSize: FontSize.xs,
  },
  pronBlock: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  phonetic: {
    color: "#d4af7a",
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  posBadge: {
    backgroundColor: "rgba(212, 175, 122, 0.12)",
    borderColor: "rgba(212, 175, 122, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  posText: {
    color: "#d4af7a",
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  meaningBlock: {
    marginTop: 2,
  },
  definition: {
    color: "#cbd5e1",
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  exampleBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: Radius.md,
    borderLeftWidth: 2,
    borderLeftColor: "#d4af7a",
  },
  exampleLabel: {
    color: "#d4af7a",
    fontSize: 10,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  example: {
    color: "#94a3b8",
    fontSize: FontSize.xs,
    fontStyle: "italic",
  },
  goldDivider: {
    height: 1,
    backgroundColor: "rgba(212, 175, 122, 0.2)",
    marginVertical: Spacing.sm,
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: FontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  translationContainer: {
    backgroundColor: "rgba(212, 175, 122, 0.08)",
    borderColor: "rgba(212, 175, 122, 0.3)",
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  translationText: {
    color: "#f8fafc",
    fontSize: 19,
    fontWeight: FontWeight.bold,
  },
  sentenceWrap: {
    marginBottom: Spacing.md,
  },
  sentenceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(212, 175, 122, 0.1)",
    borderColor: "rgba(212, 175, 122, 0.3)",
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  sentenceBtnText: {
    color: "#d4af7a",
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  sentenceResultBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: Radius.md,
  },
  sentenceResultText: {
    color: "#f8fafc",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  saveBtn: {
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: "#d4af7a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#d4af7a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  savedBtn: {
    backgroundColor: "rgba(212, 175, 122, 0.15)",
    borderWidth: 1.5,
    borderColor: "#d4af7a",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: "#0d0f17",
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  savedBtnText: {
    color: "#d4af7a",
  },
  hiddenPlayer: {
    width: 0,
    height: 0,
    opacity: 0,
    position: "absolute",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});