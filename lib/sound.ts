// lib/sounds.js
export const playSound = (type: any) => {
  const audio = new Audio(
    type === "success"
      ? "/sounds/mixkit-uplifting-flute-notification-2317.wav"
      : "/sounds/mixkit-game-show-wrong-answer-buzz-950.wav",
  );

  audio.volume = 0.3; // Increased from 0.01 to 0.3 so it's audible

  audio.play().catch((err) => {
    console.warn("Sound playback blocked:", err);
  });
};
