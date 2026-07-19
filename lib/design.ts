// Design sabitleri ve komekci funksiyalar.
// Hero / card / cover rengleri burada merkezlesib.

export const Colors = {
  bg: '#f3efe9',        // isti krem
  surface: '#ffffff',
  card: '#ffffff',
  text: '#0f172a',
  textMuted: '#6b7280',
  textSubtle: '#94a3b8',
  primary: '#1a1a1a',   // qara (buton)
  accent: '#fde68a',    // sari vurgu
  border: '#e7e2d6',
  star: '#f59e0b',
  starEmpty: '#d6d0c4',
  progressTrack: '#f1ece1',
  progressFill: '#0f172a',
  danger: '#dc2626',
  success: '#16a34a',
  // Tab bar
  tabBarBg: '#ffffff',
  tabBarActive: '#0f172a',
  tabBarInactive: '#94a3b8',
  // Reader
  readerBg: '#faf8f5',
  readerText: '#1a1a1a',
  readerNav: '#0f172a',
  readerNavDisabled: '#cbd5e1',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  hero: 32,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Cover olmayanda hash-den istifade ederek yumşaq pastel reng sec.
const COVER_PALETTE = [
  ['#fde68a', '#92400e'],
  ['#bfdbfe', '#1e3a8a'],
  ['#fecaca', '#7f1d1d'],
  ['#bbf7d0', '#14532d'],
  ['#e9d5ff', '#581c87'],
  ['#fed7aa', '#7c2d12'],
  ['#a5f3fc', '#155e75'],
  ['#fbcfe8', '#831843'],
  ['#fef08a', '#713f12'],
  ['#c7d2fe', '#312e81'],
];

export function pickCoverPalette(seed: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % COVER_PALETTE.length;
  const [bg, fg] = COVER_PALETTE[idx];
  return { bg, fg };
}

export function getInitials(text: string): string {
  const cleaned = text.trim();
  if (!cleaned) return '?';
  const words = cleaned.split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
