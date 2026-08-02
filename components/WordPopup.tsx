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
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
            }).catch(function(err) {
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
          if (p.paused && p.currentTime === 0) {
            send("error");
          }
        }, 6000);
      })();
    </script>
  </body>
</html>`;
}

export function WordPopup({ visible, word, onClose }: WordPopupProps) {
  const { targetLang } = useLanguage();
  const [pronunciation, setPronunciation] =
    useState<PronunciationResult | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(
    null,
  );
  const [pronState, setPronState] = useState<LoadState>("loading");
  const [transState, setTransState] = useState<LoadState>("loading");

  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [saved, setSaved] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (!visible || !word) {
      setPronunciation(null);
      setTranslation(null);
      setPronState("loading");
      setTransState("loading");
      setAudioQueue([]);
      setActiveAudioUrl(null);
      setSaved(false);
      setAudioError(false);
      setIsSpeaking(false);
      return;
    }

    let cancelled = false;
    setPronunciation(null);
    setTranslation(null);
    setPronState("loading");
    setTransState("loading");
    setAudioQueue([]);
    setActiveAudioUrl(null);
    setSaved(false);
    setAudioError(false);
    setIsSpeaking(false);

    getPronunciationCached(word)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setPronunciation(result);
          setPronState("ready");

          const queue: string[] = [];
          if (result.audioUrl) queue.push(result.audioUrl);
          if (result.ttsFallbackUrls?.length) {
            queue.push(...result.ttsFallbackUrls);
          }

          setAudioQueue(queue);
          if (queue.length > 0) {
            setActiveAudioUrl(queue[0]);
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
    };
  }, [visible, word]);

  const playAudio = useCallback(() => {
    if (audioQueue.length === 0) return;
    setAudioError(false);
    setIsSpeaking(true);
    setAutoPlay(true);
    setActiveAudioUrl(audioQueue[0]);
    setPlayerKey((k) => k + 1);
  }, [audioQueue]);

  const handlePlayerMessage = useCallback((event: WebViewMessageEvent) => {
    const msg = event.nativeEvent.data;
    if (msg === "playing") {
      setIsSpeaking(true);
    } else if (msg === "ended") {
      setIsSpeaking(false);
    } else if (msg === "error") {
      setAudioQueue((currentQueue) => {
        if (currentQueue.length <= 1) {
          setAudioError(true);
          setIsSpeaking(false);
          setActiveAudioUrl(null);
          return [];
        }
        const nextQueue = currentQueue.slice(1);
        setActiveAudioUrl(nextQueue[0]);
        setPlayerKey((k) => k + 1);
        setAutoPlay(true);
        return nextQueue;
      });
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

  const showOnlinePlayer = activeAudioUrl !== null;
  const playerHtml =
    showOnlinePlayer && autoPlay && activeAudioUrl
      ? buildPlayerHtml(activeAudioUrl, true)
      : SILENT_PLAYER_HTML;

  const targetBadge = "EN -> " + targetLang.toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <Text style={styles.word} numberOfLines={2}>
              {word ?? ""}
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
              hitSlop={8}
            >
              <Text style={styles.closeButtonText}>x</Text>
            </Pressable>
          </View>

          {/* Pronunciation Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Oxunusu</Text>
              <Pressable
                onPress={playAudio}
                disabled={audioQueue.length === 0}
                style={({ pressed }) => [
                  styles.playButton,
                  pressed && styles.pressed,
                  audioQueue.length === 0 && styles.playButtonDisabled,
                ]}
                hitSlop={6}
              >
                <Text style={styles.playButtonText}>
                  {isSpeaking ? "... Dinlənilir" : "Dinlə"}
                </Text>
              </Pressable>
            </View>

            {pronState === "loading" ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#2563eb" />
                <Text style={styles.muted}> Yüklənir...</Text>
              </View>
            ) : pronState === "error" || !pronunciation ? (
              <Text style={styles.muted}>Bu söz üçün oxunuş tapılmadı.</Text>
            ) : (
              <View style={styles.pronBlock}>
                {pronunciation.phonetic ? (
                  <Text style={styles.phonetic}>{pronunciation.phonetic}</Text>
                ) : null}
                {pronunciation.meanings.slice(0, 2).map((meaning, idx) => (
                  <View key={idx} style={styles.meaningBlock}>
                    <Text style={styles.partOfSpeech}>
                      {meaning.partOfSpeech}
                    </Text>
                    <Text style={styles.definition}>{meaning.definition}</Text>
                    {meaning.example ? (
                      <Text style={styles.example}>"{meaning.example}"</Text>
                    ) : null}
                  </View>
                ))}
                {audioError ? (
                  <Text style={styles.audioErrorText}>Səs oxuna bilmədi</Text>
                ) : null}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Translation Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tərcüməsi</Text>
              <Text style={styles.langBadge}>{targetBadge}</Text>
            </View>

            {transState === "loading" ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#2563eb" />
                <Text style={styles.muted}> Tərcümə edilir...</Text>
              </View>
            ) : transState === "error" || !translation ? (
              <Text style={styles.muted}>Tərcümə tapılmadı.</Text>
            ) : (
              <Text style={styles.translation}>{translation.translated}</Text>
            )}
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={saved || !word}
            style={({ pressed }) => [
              styles.saveBtn,
              saved && styles.saveBtnSaved,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.saveBtnText, saved && styles.saveBtnTextSaved]}
            >
              {saved ? "Yadda saxlanıldı" : "Yadda saxla"}
            </Text>
          </Pressable>

          {/* Invisible Audio Player WebView */}
          {showOnlinePlayer ? (
            <View style={styles.hiddenPlayer}>
              <WebView
                key={playerKey}
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: playerHtml, baseUrl: "https://localhost" }}
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
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  word: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    lineHeight: 18,
    color: "#475569",
    fontWeight: "600",
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
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  langBadge: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  muted: {
    color: "#94a3b8",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  playButton: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  playButtonText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "600",
  },
  pronBlock: {
    gap: 10,
  },
  phonetic: {
    fontSize: 20,
    color: "#1d4ed8",
    fontFamily: "Georgia",
    fontStyle: "italic",
  },
  meaningBlock: {
    gap: 4,
  },
  partOfSpeech: {
    fontSize: 12,
    color: "#7c3aed",
    fontWeight: "600",
    fontStyle: "italic",
  },
  definition: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
  },
  example: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
    lineHeight: 18,
  },
  audioErrorText: {
    fontSize: 12,
    color: "#dc2626",
    fontStyle: "italic",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 4,
  },
  translation: {
    fontSize: 18,
    color: "#0f172a",
    fontWeight: "500",
    lineHeight: 24,
  },
  saveBtn: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  saveBtnSaved: {
    backgroundColor: "#dcfce7",
    borderColor: "#16a34a",
  },
  saveBtnText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  saveBtnTextSaved: {
    color: "#166534",
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
