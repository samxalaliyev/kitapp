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

import {
  fetchPronunciation,
  type PronunciationResult,
} from "@/lib/pronunciation";
import {
  translateToAzerbaijani,
  type TranslationResult,
} from "@/lib/translation";

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
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;padding:0;background:transparent;">
    <audio id="player" src="${safeUrl}" preload="auto" ${autoplay ? "autoplay" : ""}></audio>
    <script>
      var p = document.getElementById('player');
      window.playAudio = function () {
        if (!p) return;
        try { p.currentTime = 0; p.play(); } catch (e) {}
      };
      window.stopAudio = function () {
        if (!p) return;
        try { p.pause(); p.currentTime = 0; } catch (e) {}
      };
      if (p) {
        p.addEventListener('ended', function () {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage('ended');
          }
        });
      }
    </script>
  </body>
</html>`;
}

export function WordPopup({ visible, word, onClose }: WordPopupProps) {
  const [pronunciation, setPronunciation] =
    useState<PronunciationResult | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(
    null,
  );
  const [pronState, setPronState] = useState<LoadState>("loading");
  const [transState, setTransState] = useState<LoadState>("loading");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const webViewRef = useRef<WebView>(null);

  // Soz deyisende melumatlari yeniden cek.
  useEffect(() => {
    if (!visible || !word) {
      setPronunciation(null);
      setTranslation(null);
      setPronState("loading");
      setTransState("loading");
      setAudioUrl(null);
      return;
    }

    let cancelled = false;
    setPronunciation(null);
    setTranslation(null);
    setPronState("loading");
    setTransState("loading");
    setAudioUrl(null);

    fetchPronunciation(word)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setPronunciation(result);
          setPronState("ready");
          if (result.audioUrl) {
            setAudioUrl(result.audioUrl);
          }
        } else {
          setPronState("error");
        }
      })
      .catch(() => {
        if (!cancelled) setPronState("error");
      });

    translateToAzerbaijani(word)
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

    return () => {
      cancelled = true;
    };
  }, [visible, word]);

  const playAudio = useCallback(() => {
    if (!audioUrl) return;
    // Her defe yeni WebView yarad ki play() avtomatik islesin.
    setPlayerKey((k) => k + 1);
  }, [audioUrl]);

  const handlePlayerMessage = useCallback((event: WebViewMessageEvent) => {
    if (event.nativeEvent.data === "ended") {
      // isPlaying state-ini izlemeye ehtiyac yoxdur, WebView oz ozune bitir.
    }
  }, []);

  const playerHtml = audioUrl
    ? buildPlayerHtml(audioUrl, true)
    : SILENT_PLAYER_HTML;

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

          {/* Pronunciation section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Oxunusu</Text>
              {pronunciation?.audioUrl ? (
                <Pressable
                  onPress={playAudio}
                  style={({ pressed }) => [
                    styles.playButton,
                    pressed && styles.pressed,
                  ]}
                  hitSlop={6}
                >
                  <Text style={styles.playButtonText}>Dinle</Text>
                </Pressable>
              ) : null}
            </View>

            {pronState === "loading" ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#2563eb" />
                <Text style={styles.muted}> Yuklenir...</Text>
              </View>
            ) : pronState === "error" || !pronunciation ? (
              <Text style={styles.muted}>Bu soz ucun oxunu tapilmadi.</Text>
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
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Translation section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ter cumesi</Text>
              <Text style={styles.langBadge}>
                EN {"->"} AZ{" "}
                {translation?.provider ? "* " + translation.provider : ""}
              </Text>
            </View>

            {transState === "loading" ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#2563eb" />
                <Text style={styles.muted}> Tercume edilir...</Text>
              </View>
            ) : transState === "error" || !translation ? (
              <Text style={styles.muted}>Tercume tapilmadi.</Text>
            ) : (
              <Text style={styles.translation}>{translation.translated}</Text>
            )}
          </View>

          {/* Hidden audio player */}
          {audioUrl ? (
            <View style={styles.hiddenPlayer}>
              <WebView
                key={playerKey}
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: playerHtml, baseUrl: "https://localhost" }}
                onMessage={handlePlayerMessage}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback
                javaScriptEnabled
                domStorageEnabled
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
    fontFamily: "Georgia, serif",
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
  hiddenPlayer: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
  },
  hiddenWebview: {
    width: 0,
    height: 0,
  },
});
