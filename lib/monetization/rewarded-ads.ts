import { Alert } from 'react-native';

export type RewardType = 'bonus_translations' | 'bonus_download' | 'unlock_theme';

export interface WatchAdOptions {
  type: RewardType;
  onSuccess: (rewardBonus: number) => void;
}

/**
 * Simulates or triggers a 30-second Rewarded Video Ad.
 * Upon successful completion, grants the corresponding perk (+10 words, +1 download, theme).
 */
export function watchRewardedAd({ type, onSuccess }: WatchAdOptions): void {
  const titles: Record<RewardType, string> = {
    bonus_translations: '🎥 Video İzlə -> +10 Əlavə Tərcümə Qazan',
    bonus_download: '🎥 Video İzlə -> +1 Əlavə Oflayn Kitab Yüklə',
    unlock_theme: '🎥 Video İzlə -> Xüsusi Mövzunu 24 Saatlıq Aç',
  };

  const messages: Record<RewardType, string> = {
    bonus_translations: '30 saniyəlik videoya baxaraq bu gün üçün +10 əlavə tərcümə balansı qazanacaqsınız.',
    bonus_download: '30 saniyəlik videoya baxaraq cihazınıza +1 əlavə oflayn kitab endirmə hüququ qazanacaqsınız.',
    unlock_theme: '30 saniyəlik videoya baxaraq xüsusi OLED görünüş mövzusunu 24 saatlıq pulsuz istifadə edin.',
  };

  Alert.alert(titles[type], messages[type], [
    { text: 'Ləğv et', style: 'cancel' },
    {
      text: '▶️ Videonu İzlə (30s)',
      onPress: () => {
        // Simulate successful 30s ad completion
        const bonusAmount = type === 'bonus_translations' ? 10 : 1;
        onSuccess(bonusAmount);
        Alert.alert(
          '🎉 Təbriklər!',
          type === 'bonus_translations'
            ? '+10 əlavə tərcümə balansı hesabınıza əlavə olundu!'
            : '+1 əlavə yükləmə balansı qazanıldı!'
        );
      },
    },
  ]);
}
