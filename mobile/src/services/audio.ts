import * as Haptics from 'expo-haptics';

export const triggerStartHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (err) {
    // Haptics unavailable on web/simulator
  }
};

export const triggerStopHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (err) {
    // Haptics unavailable on web/simulator
  }
};

export const triggerSuccessHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (err) {
    // Haptics unavailable on web/simulator
  }
};

export const triggerErrorHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (err) {
    // Haptics unavailable on web/simulator
  }
};
