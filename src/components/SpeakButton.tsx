import { Volume2 } from 'lucide-react';
import { isSpeechSupported, speakChinese } from '../utils/speech';

interface SpeakButtonProps {
  text: string;
  compact?: boolean;
  showSlow?: boolean;
}

export function SpeakButton({ text, compact = false, showSlow = false }: SpeakButtonProps) {
  if (!isSpeechSupported()) return null;

  return (
    <span className="speak-group" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={compact ? 'btn-icon-sm' : 'btn-speak'}
        onClick={() => speakChinese(text, 0.95)}
        title="ฟังเสียงอ่านภาษาจีน"
        aria-label={`ฟังเสียง ${text}`}
      >
        <Volume2 size={16} />
        {!compact && <span>ฟังเสียง</span>}
      </button>
      {showSlow && (
        <button
          type="button"
          className="btn-slow"
          onClick={() => speakChinese(text, 0.65)}
          title="ฟังเสียงแบบช้า"
        >
          ช้า 0.6x
        </button>
      )}
    </span>
  );
}
