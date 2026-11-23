import { Pause, Play, Radio, SkipForward, X } from 'lucide-react';
import { PodcastEpisode } from '../data/types';

interface MiniPodcastBarProps {
  episode: PodcastEpisode;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onOpenPodcast: () => void;
  onClose: () => void;
}

export function MiniPodcastBar({
  episode,
  isPlaying,
  onTogglePlay,
  onNext,
  onOpenPodcast,
  onClose,
}: MiniPodcastBarProps) {
  return (
    <div className="mini-podcast-bar" role="region" aria-label="แถบเล่นพอดแคสต์">
      <button type="button" className="mini-pod-info" onClick={onOpenPodcast}>
        <span className="mini-pod-icon">
          <Radio size={15} />
        </span>
        <div className="mini-pod-text">
          <strong className="truncate">{episode.title}</strong>
          <span className="muted">{isPlaying ? 'กำลังเล่น...' : 'หยุดชั่วคราว'} · แตะเพื่อดูสคริปต์</span>
        </div>
      </button>

      <div className="mini-pod-actions">
        <button type="button" className="btn-icon-sm" onClick={onTogglePlay} aria-label={isPlaying ? 'หยุด' : 'เล่น'}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button type="button" className="btn-icon-sm" onClick={onNext} aria-label="ตอนถัดไป">
          <SkipForward size={16} />
        </button>
        <button type="button" className="btn-icon-sm" onClick={onClose} aria-label="ปิดแถบเล่น">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
