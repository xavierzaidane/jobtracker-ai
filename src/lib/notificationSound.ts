// Zero-dependency, pure Web Audio API notification synthesizer

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playNotificationSound(type: "default" | "offer" | "interview" | "subtle" = "default") {
  if (typeof window === "undefined") return;

  // Check if user has muted sounds
  try {
    const isMuted = localStorage.getItem("job_tracker_sound_muted") === "true";
    if (isMuted) return;
  } catch {}

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === "offer" || type === "interview") {
    // Celebratory 3-tone harmonic chime (C5 -> E5 -> G5)
    const tones = [523.25, 659.25, 783.99]; // C5, E5, G5
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.1 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.5);
    });
  } else if (type === "subtle") {
    // Subtle soft click / tap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } else {
    // Standard modern 2-tone notification chime (D5 -> A5)
    const tones = [587.33, 880.0];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }
}

