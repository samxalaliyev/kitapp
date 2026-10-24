import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NOTIFICATION_STORAGE_KEYS = {
  ENABLED: '@litera:notifications_enabled',
  TIME: '@litera:notification_time', // "HH:MM" e.g. "20:00"
  LAST_SCHEDULED: '@litera:notifications_last_scheduled',
};

export const NOTIFICATION_CHANNELS = {
  DAILY_REMINDER: 'litera-daily-reminders',
  STREAK_ALERT: 'litera-streak-alerts',
  VOCABULARY: 'litera-vocabulary-review',
};

export interface NotificationPreferences {
  enabled: boolean;
  time: string; // "20:00"
  hour: number;
  minute: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Duolingo-style Inspiring & Habit-forming Notification Messages (Multi-language)
// ─────────────────────────────────────────────────────────────────────────────
interface NotificationCopy {
  title: string;
  body: string;
}

const NOTIFICATION_MESSAGES: Record<string, {
  daily: NotificationCopy[];
  streak: NotificationCopy[];
  vocab: NotificationCopy[];
  inactivity: NotificationCopy[];
}> = {
  az: {
    daily: [
      { title: '📖 Oxu vaxtı çatdı!', body: 'Günün sakitlik və ilham anı. Qaldığın səhifədən davam et.' },
      { title: '☕ 10 dəqiqəlik klassika', body: 'Günün yorğunluğunu dünya ədəbiyyatı ilə çıxar. Kitabın səni gözləyir.' },
      { title: '✨ Qürur və Qərəz, yoxsa Tolstoy?', body: 'Növbəti fəsil səni gözləyir. İndi oxumağa başla.' },
    ],
    streak: [
      { title: '🔥 Seriyanı qoru!', body: 'Günün oxu seriyası pozulmaq üzrədir! Cəmi 3 dəqiqə oxu və vərdişini yaşat.' },
      { title: '⚡ Gündəlik hədəfinə az qaldı', body: 'Oxuma seriyanı itirmə. 1 fəsil oxu və seriyanı növbəti günə daşı!' },
    ],
    vocab: [
      { title: '🧠 Sözləri möhkəmləndir', body: 'Yaddaşında yeni ingiliscə sözlər təkrar olunmağı gözləyir. 2 dəqiqəlik Flashcard!' },
      { title: '💡 Yeni sözlər hazır', body: 'Kitabda qeyd etdiyin sözləri təkrar et və uzunmüddətli yaddaşına köçür.' },
    ],
    inactivity: [
      { title: '🦉 Darıxdıq!', body: 'Kitab rəfin səni gözləyir. 5 dəqiqəlik fasilə ver və sevdiyin əsərə qayıt.' },
    ],
  },
  en: {
    daily: [
      { title: '📖 Time for your daily read!', body: 'A peaceful moment with timeless literature. Pick up right where you left off.' },
      { title: '☕ 10 minutes of classic stories', body: 'Unwind with world masterpieces. Your chapter is waiting.' },
      { title: '✨ A journey through great minds', body: 'Dive into your book and discover wisdom for today.' },
    ],
    streak: [
      { title: '🔥 Keep your streak alive!', body: "Your reading streak is about to reset. Read for just 3 minutes to protect it!" },
      { title: '⚡ Don’t lose your momentum', body: 'Complete today’s reading goal before midnight!' },
    ],
    vocab: [
      { title: '🧠 Lock in your vocabulary', body: 'Your saved words are ready for quick review. Master them with 3D Flashcards!' },
      { title: '💡 2-minute memory challenge', body: 'Strengthen words you recently discovered while reading.' },
    ],
    inactivity: [
      { title: '🦉 We miss you!', body: 'Your bookshelf misses you. Take a quick pause and continue your journey.' },
    ],
  },
  tr: {
    daily: [
      { title: '📖 Günün okuma vakti geldi!', body: 'Huzurlu bir mola ver. Kaldığın bölüm seni bekliyor.' },
      { title: '☕ 10 dakikalık klasik molası', body: 'Günün yorgunluğunu dünya edebiyatıyla at. Kitabın açık bekliyor.' },
    ],
    streak: [
      { title: '🔥 Okuma serini koru!', body: 'Serin bozulmak üzere! Seriyi canlı tutmak için sadece 3 dakika oku.' },
    ],
    vocab: [
      { title: '🧠 Kelimeleri kalıcı hafızaya al', body: 'Yeni İngilizce kelimelerin hazır. 2 dakikalık hızlı tekrar!' },
    ],
    inactivity: [
      { title: '🦉 Seni özledik!', body: 'Kitaplığın seni bekliyor. Kaldığın yerden bir sayfa okumaya ne dersin?' },
    ],
  },
  ru: {
    daily: [
      { title: '📖 Время для чтения!', body: 'Минута вдохновения с бессмертной классикой. Продолжи с того места, где остановился.' },
      { title: '☕ 10 минут с любимой книгой', body: 'Отдохни с шедеврами мировой литературы. Твоя глава ждет.' },
    ],
    streak: [
      { title: '🔥 Сохрани свой страйк!', body: 'Твой страйк чтения под угрозой. Почитай всего 3 минуты, чтобы спасти его!' },
    ],
    vocab: [
      { title: '🧠 Закрепи новые слова', body: 'Слова готовы к повторению. Удели 2 минуты интерактивным карточкам!' },
    ],
    inactivity: [
      { title: '🦉 Мы скучаем!', body: 'Твоя книжная полка ждет тебя. Возвращайся к чтению!' },
    ],
  },
};

/**
 * Configure Android notification channels for crisp sounds and high priority
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DAILY_REMINDER, {
      name: 'Gündəlik Oxu Xatırlatmaları',
      description: 'Gündəlik oxuma vərdişi və kitab xatırlatmaları',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF7A',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.STREAK_ALERT, {
      name: 'Oxu Seriyası Xəbərdarlıqları',
      description: 'Seriyanın pozulmasının qarşısını alan bildirişlər',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 150, 300],
      lightColor: '#F59E0B',
      sound: 'default',
    });
  } catch (err) {
    if (__DEV__) console.warn('[Notifications] setupNotificationChannels error:', err);
  }
}

/**
 * Request notification permissions from user (Android 13+ POST_NOTIFICATIONS & iOS)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    await setupNotificationChannels();
    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      granted = requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }

    return granted;
  } catch (err) {
    if (__DEV__) console.warn('[Notifications] requestPermissions error:', err);
    return false;
  }
}

/**
 * Get current user notification preferences from AsyncStorage
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const [enabledStr, timeStr] = await Promise.all([
      AsyncStorage.getItem(NOTIFICATION_STORAGE_KEYS.ENABLED),
      AsyncStorage.getItem(NOTIFICATION_STORAGE_KEYS.TIME),
    ]);

    const enabled = enabledStr !== null ? enabledStr === 'true' : true; // Default ON
    const time = timeStr || '20:00'; // Default 8:00 PM
    const [h, m] = time.split(':').map((v) => parseInt(v, 10) || 0);

    return {
      enabled,
      time,
      hour: Math.min(Math.max(h, 0), 23),
      minute: Math.min(Math.max(m, 0), 59),
    };
  } catch {
    return { enabled: true, time: '20:00', hour: 20, minute: 0 };
  }
}

/**
 * Save user notification preferences and reschedule automatically
 */
export async function saveNotificationPreferences(
  enabled: boolean,
  time?: string,
  lang: string = 'az'
): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEYS.ENABLED, String(enabled));
    if (time) {
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEYS.TIME, time);
    }

    if (!enabled) {
      await cancelAllReminders();
    } else {
      await scheduleAllSmartReminders(lang);
    }
  } catch (err) {
    if (__DEV__) console.warn('[Notifications] saveNotificationPreferences error:', err);
  }
}

/**
 * Cancel all currently scheduled notifications
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    if (__DEV__) console.warn('[Notifications] cancelAllReminders error:', err);
  }
}

/**
 * Get localized notification copy
 */
function getMessagePool(lang: string) {
  const normalized = (lang || 'az').toLowerCase();
  return NOTIFICATION_MESSAGES[normalized] || NOTIFICATION_MESSAGES.az;
}

/**
 * Schedule smart, habit-forming notifications (Daily + Streak + Inactivity)
 */
export async function scheduleAllSmartReminders(lang: string = 'az'): Promise<boolean> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled) {
    await cancelAllReminders();
    return false;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  try {
    // 1. Clear older schedules to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    const pool = getMessagePool(lang);
    const dailyItem = pool.daily[Math.floor(Math.random() * pool.daily.length)];

    // 2. Schedule Daily Habit Reminder (Repeating daily at user-selected hour:minute)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: dailyItem.title,
        body: dailyItem.body,
        sound: true,
        color: '#D4AF7A',
        data: { screen: 'library' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.hour,
        minute: prefs.minute,
      },
    });

    // 3. Schedule 48-Hour Inactivity Re-engagement Nudge (fires if user hasn't opened app in 2 days)
    const inactivityItem = pool.inactivity[0] || pool.daily[0];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: inactivityItem.title,
        body: inactivityItem.body,
        sound: true,
        color: '#D4AF7A',
        data: { screen: 'library' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 48 * 3600, // 48 hours from now
        repeats: false,
      },
    });

    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEYS.LAST_SCHEDULED, new Date().toISOString());
    return true;
  } catch (err) {
    if (__DEV__) console.warn('[Notifications] scheduleAllSmartReminders error:', err);
    return false;
  }
}

/**
 * Send an instant demo notification (fires in 2 seconds) for testing
 */
export async function sendInstantTestNotification(lang: string = 'az'): Promise<boolean> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  try {
    const pool = getMessagePool(lang);
    const item = pool.daily[0];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 Litera: ${item.title}`,
        body: item.body,
        sound: true,
        color: '#D4AF7A',
        data: { test: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        repeats: false,
      },
    });

    return true;
  } catch (err) {
    if (__DEV__) console.warn('[Notifications] sendInstantTestNotification error:', err);
    return false;
  }
}
