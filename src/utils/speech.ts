import { AUDIO_MAP } from '../data/audioMap';

let currentAudio: HTMLAudioElement | null = null;

function normalizeAudioKey(text: string): string {
  return text.replace(/[（()）\[\]…\s]+/g, '').trim();
}

function hasSpeechSynthesis(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

function fallbackSpeech(text: string, rate: number): void {
  if (!hasSpeechSynthesis() || !text.trim()) return;
  try {
    window.speechSynthesis.cancel();
    const cleaned = text.replace(/[（()）\[\]…]/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;

    const voices = window.speechSynthesis.getVoices();
    const zhVoice =
      voices.find((v) => v.lang.toLowerCase() === 'zh-cn') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('zh'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully ignore speech playback errors on restricted devices
  }
}

export function isSpeechSupported(): boolean {
  return typeof Audio !== 'undefined' || hasSpeechSynthesis();
}

export function speakChinese(text: string, rate = 0.95): void {
  if (!text.trim()) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (hasSpeechSynthesis()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancel errors
    }
  }

  const key = normalizeAudioKey(text);
  const filename = AUDIO_MAP[key];

  if (filename && typeof Audio !== 'undefined') {
    try {
      const audio = new Audio(`./audio/${filename}`);
      audio.playbackRate = rate;
      if ('preservesPitch' in audio) {
        audio.preservesPitch = true;
      }
      currentAudio = audio;
      audio.onended = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }
      };
      audio.play().catch(() => {
        fallbackSpeech(text, rate);
      });
      return;
    } catch {
      // Fall through to Web Speech API fallback
    }
  }

  fallbackSpeech(text, rate);
}
