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

import { useLanguage } from "@/lib/i18n/LanguageContext";
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
  onClose: () => void;
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

import { useAppTheme } from "@/lib/theme";

export function WordPopup({ visible, word, onClose }: WordPopupProps) {
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();
  const [pronunciation, setPronunciation] =
    useState<PronunciationResult | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(
    null,
  );
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

  useEffect(() => {
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

    let cancelled = false;
    setPronunciation(null);
    setTranslation(null);
    setPronState("loading");
    setTransState("loading");
    setAudioDataUrl(null);
    setSaved(false);
    setAudioError(false);
    setIsSpeaking(false);
    setAudioLoading(false);

    let activeAudioUrl: string | null = null;

    getPronunciationCached(word)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setPronunciation(result);
          setPronState("ready");
          // Birinci audio URL-i goturur, data-URL formatina cevir.
          const queue: string[] = [];
          if (result.audioUrl) queue.push(result.audioUrl);
          if (result.ttsFallbackUrls && result.ttsFallbackUrls.length) {
            queue.push(...result.ttsFallbackUrls);
          }
          activeAudioUrl = queue[0] ?? null;
          if (activeAudioUrl) {
            setAudioLoading(true);
            getAudioDataUrl(activeAudioUrl)
              .then((dataUrl) => {
                if (cancelled) return;
                setAudioDataUrl(dataUrl);
                setAudioLoading(false);
              })
              .catch(() => {
                if (cancelled) return;
                setAudioError(true);
                setAudioLoading(false);
              });
          }
        } else {
          setPronState("error");
        }
      })
      .catch(() => {
        if (!cancelled) setPronState("error");
      });

    translateWord(word)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setTranslation(result);
          setTransState("ready");
        } else {
          setTransState("error");
        }
      })
      .catch(() => {
        if (!cancelled) setTransState("error");
      });

    isWordSaved(word)
      .then((alreadySaved) => {
        if (!cancelled) setSaved(alreadySaved);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      void activeAudioUrl;
    };
  }, [visible, word]);

  const onPlayPress = useCallback(() => {
    if (audioLoading) return;
    if (audioError && !audioDataUrl) {
      // data-URL yuklenmedi, fallback URL-ə artiq sinadik, daha yox.
      return;
    }
    if (!audioDataUrl) return;
    setAudioError(false);
    setIsSpeaking(true);
    setAutoPlay(true);
    setPlayerKey((k) => k + 1);
  }, [audioDataUrl, audioError, audioLoading]);

  const handlePlayerMessage = useCallback((event: WebViewMessageEvent) => {
    const msg = event.nativeEvent.data;
    if (msg === "playing") {
      setIsSpeaking(true);
    } else if (msg === "ended") {
      setIsSpeaking(false);
    } else if (msg === "error") {
      setIsSpeaking(false);
      setAudioError(true);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!word) return;
    try {
      await saveWord({
        word,
        translation: translation?.translated ?? null,
        phonetic: pronunciation?.phonetic ?? null,
        language: targetLang,
      });
      setSaved(true);
    } catch {
      // ignore
    }
  }, [word, translation, pronunciation, targetLang]);

  const showOnlinePlayer = audioDataUrl !== null;
  const playerHtml =
    showOnlinePlayer && autoPlay
      ? buildPlayerHtml(audioDataUrl, true)
      : SILENT_PLAYER_HTML;

  const targetBadge = "EN -> " + targetLang.toUpperCase();
  const playLabel = audioLoading
    ? "Yuklenir..."
    : isSpeaking
    ? "... Dinlenilir"
    : "Dinle";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.word, { color: colors.text }]} numberOfLines={2}>
              {word ?? ""}
            </Text>

            <Pressable
              onPress={onPlayPress}
              disabled={audioLoading || (!audioDataUrl && !audioError)}
              style={({ pressed }) => [
                styles.audioIconBtn,
                { backgroundColor: colors.primaryBg },
                pressed && styles.pressed,
              ]}
              hitSlop={8}
            >
              <Text style={{ fontSize: 16 }}>🔊</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.surfaceBorder },
                pressed && styles.pressed,
              ]}
              hitSlop={8}
            >
              <Text style={[styles.closeButtonText, { color: colors.textMuted }]}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            {pronState === "loading" ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.muted, { color: colors.textMuted }]}>  {t('loading')}</Text>
              </View>
            ) : pronState === "error" || !pronunciation ? (
              <Text style={[styles.muted, { color: colors.textMuted }]}>{t('no_definition')}</Text>
            ) : (
              <View style={styles.pronBlock}>
                <View style={styles.badgeRow}>
                  {pronunciation.phonetic ? (
                    <Text style={[styles.phonetic, { color: colors.primary }]}>{pronunciation.phonetic}</Text>
                  ) : null}

                  {pronunciation.meanings[0]?.partOfSpeech ? (
                    <View style={[styles.posBadge, { backgroundColor: colors.badgeBg }]}>
                      <Text style={[styles.posText, { color: colors.badgeText }]}>
                        {pronunciation.meanings[0].partOfSpeech}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {pronunciation.meanings.slice(0, 1).map((meaning, idx) => (
                  <View key={idx} style={styles.meaningBlock}>
                    <Text style={[styles.definition, { color: colors.text }]}>{meaning.definition}</Text>
                    {meaning.example ? (
                      <View style={styles.exampleBox}>
                        <Text style={[styles.exampleLabel, { color: colors.textMuted }]}>{t('example_label')}</Text>
                        <Text style={[styles.example, { color: colors.textMuted }]}>"{meaning.example}"</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('translation_header')}</Text>
              <Text style={[styles.langBadge, { backgroundColor: colors.primaryBg, color: colors.primary }]}>
                {targetBadge}
              </Text>
            </View>

            {transState === "loading" ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.muted, { color: colors.textMuted }]}>  {t('translating')}</Text>
              </View>
            ) : transState === "error" || !translation ? (
              <Text style={[styles.muted, { color: colors.textMuted }]}>{t('no_translation')}</Text>
            ) : (
              <Text style={[styles.translation, { color: colors.text }]}>{translation.translated}</Text>
            )}
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saved || !word}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: saved ? colors.surfaceBorder : colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.saveBtnText, { color: saved ? colors.textMuted : '#ffffff' }]}
            >
              {saved ? t('word_saved') : t('add_to_vocab')}
            </Text>
          </Pressable>

          {showOnlinePlayer ? (
            <View style={styles.hiddenPlayer}>
              <WebView
                key={playerKey}
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: playerHtml, baseUrl: "data:audio" }}
                onMessage={handlePlayerMessage}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="always"
                style={styles.hiddenWebview}
              />
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 24,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  word: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  audioIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  langBadge: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  phonetic: {
    fontSize: 15,
    fontWeight: "600",
  },
  posBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  posText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "lowercase",
  },
  meaningBlock: {
    gap: 4,
  },
  definition: {
    fontSize: 14,
    lineHeight: 20,
  },
  exampleBox: {
    marginTop: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(99, 102, 241, 0.4)",
    gap: 2,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  example: {
    fontSize: 13,
    fontStyle: "italic",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  muted: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  pronBlock: {
    gap: 10,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  translation: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  hiddenPlayer: {
    position: "absolute",
    width: 10,
    height: 10,
    opacity: 0.01,
    overflow: "hidden",
    bottom: 0,
    right: 0,
  },
  hiddenWebview: {
    width: 10,
    height: 10,
  },
});