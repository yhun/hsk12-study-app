export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function speakChinese(text: string, rate = 0.95): void {
  if (!isSpeechSupported() || !text.trim()) return;
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
