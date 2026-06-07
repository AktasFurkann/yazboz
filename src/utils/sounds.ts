type SoundKey = 'loss' | 'alert';

export const playSound = async (_key: SoundKey): Promise<void> => {
  // Sound playback temporarily disabled — handled by vibration only.
};
