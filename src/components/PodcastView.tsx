import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Moon,
  Pause,
  Play,
  Radio,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { PODCAST_EPISODES } from '../data/podcasts';
import { PodcastEpisode } from '../data/types';
import { formatTime, SleepTimerMode } from '../hooks/usePodcastPlayer';

interface PodcastViewProps {
  completedPodcasts: string[];
  showPinyin: boolean;
  currentEpisode: PodcastEpisode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: 0.75 | 1 | 1.25;
  autoPlayNext: boolean;
  sleepTimer: SleepTimerMode;
  sleepMinutesLeft: number | null;
  onPlayEpisode: (ep: PodcastEpisode) => void;
  onTogglePlay: () => void;
  onSeek: (sec: number) => void;
  onSkip: (delta: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onChangeRate: (r: 0.75 | 1 | 1.25) => void;
  onToggleAutoPlayNext: () => void;
  onChooseSleepTimer: (mode: SleepTimerMode) => void;
}

export function PodcastView({
  completedPodcasts,
  showPinyin,
  currentEpisode,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  autoPlayNext,
  sleepTimer,
  sleepMinutesLeft,
  onPlayEpisode,
  onTogglePlay,
  onSeek,
  onSkip,
  onNext,
  onPrev,
  onChangeRate,
  onToggleAutoPlayNext,
  onChooseSleepTimer,
}: PodcastViewProps) {
  const [notesExpanded, setNotesExpanded] = useState(true);
  const activeEp = currentEpisode ?? PODCAST_EPISODES[0];
  const isLoadedActive = currentEpisode !== null;

  return (
    <div className="stack">
      {/* Main Podcast Player Card */}
      <section className="podcast-hero-card">
        <div className="podcast-top-row">
          <span className="podcast-badge">
            <Radio size={14} /> พอดแคสต์ครูสอนจีน · สองภาษา (ไทย+จีน)
          </span>
          <span className="pill">{activeEp.level}</span>
        </div>

        <h2 className="podcast-title">{activeEp.title}</h2>
        <p className="podcast-sub">{activeEp.subtitle}</p>

        {/* Timeline */}
        <div className="podcast-scrubber">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            value={isLoadedActive ? currentTime : 0}
            disabled={!isLoadedActive || duration <= 0}
            onChange={(e) => onSeek(Number(e.target.value))}
            aria-label="เลื่อนเวลาพอดแคสต์"
          />
          <div className="podcast-times">
            <span>{isLoadedActive ? formatTime(currentTime) : '0:00'}</span>
            <span>{isLoadedActive && duration > 0 ? formatTime(duration) : activeEp.durationLabel}</span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="podcast-controls">
          <button type="button" className="pod-ctrl-btn" onClick={onPrev} title="ตอนก่อนหน้า" aria-label="ตอนก่อนหน้า">
            <SkipBack size={20} />
          </button>
          <button
            type="button"
            className="pod-ctrl-btn"
            onClick={() => onSkip(-15)}
            disabled={!isLoadedActive}
            title="ย้อน 15 วินาที"
          >
            <RotateCcw size={18} />
            <span className="skip-num">15</span>
          </button>
          <button
            type="button"
            className="pod-play-btn"
            onClick={() => (isLoadedActive ? onTogglePlay() : onPlayEpisode(activeEp))}
            aria-label={isPlaying ? 'หยุดชั่วคราว' : 'เล่น'}
          >
            {isPlaying ? <Pause size={26} /> : <Play size={26} />}
          </button>
          <button
            type="button"
            className="pod-ctrl-btn"
            onClick={() => onSkip(15)}
            disabled={!isLoadedActive}
            title="ข้าม 15 วินาที"
          >
            <RotateCw size={18} />
            <span className="skip-num">15</span>
          </button>
          <button type="button" className="pod-ctrl-btn" onClick={onNext} title="ตอนถัดไป" aria-label="ตอนถัดไป">
            <SkipForward size={20} />
          </button>
        </div>

        {/* Speed, Autoplay, Sleep Timer */}
        <div className="podcast-options">
          <div className="pod-opt-group">
            {([0.75, 1, 1.25] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={`pod-chip ${playbackRate === r ? 'active' : ''}`}
                onClick={() => onChangeRate(r)}
              >
                {r}x
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`pod-chip ${autoPlayNext ? 'active' : ''}`}
            onClick={onToggleAutoPlayNext}
          >
            เล่นตอนถัดไปอัตโนมัติ: {autoPlayNext ? 'เปิด' : 'ปิด'}
          </button>

          <div className="pod-sleep-row">
            <Moon size={14} />
            <span className="muted">ตั้งเวลาปิด:</span>
            {(
              [
                ['off', 'ไม่ตั้ง'],
                ['10', '10 นาที'],
                ['20', '20 นาที'],
                ['episode', 'จบตอนนี้'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={`pod-chip ${sleepTimer === mode ? 'active' : ''}`}
                onClick={() => onChooseSleepTimer(mode)}
              >
                {label}
              </button>
            ))}
            {sleepMinutesLeft !== null && <span className="pill">{sleepMinutesLeft} นาที</span>}
          </div>
        </div>
      </section>

      {/* Show Notes / Sentences in Current Episode */}
      <section className="card">
        <button
          type="button"
          className="notes-toggle-head"
          onClick={() => setNotesExpanded((e) => !e)}
        >
          <strong>ประโยคตัวอย่างในตอนนี้ ({activeEp.pdfPages})</strong>
          {notesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {notesExpanded && (
          <div className="pod-notes-list">
            {activeEp.keyPoints.map((kp, i) => (
              <div key={i} className="pod-note-row">
                <div className="zh-md">{kp.zh}</div>
                {showPinyin && <div className="pinyin">{kp.pinyin}</div>}
                <div className="th-text">{kp.th}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Episode Playlist */}
      <section className="card">
        <div className="stage-head">
          <div>
            <h3>เพลย์ลิสต์ทั้งหมด ({PODCAST_EPISODES.length} ตอน)</h3>
            <p className="muted">ฟังยาวต่อเนื่องได้แม้ล็อกหน้าจอมือถือ (เปิดเล่นแล้วกดฟังเพลินๆ ได้เลย)</p>
          </div>
          <button
            type="button"
            className="btn-primary sm-pad"
            onClick={() => onPlayEpisode(PODCAST_EPISODES[0])}
          >
            <Play size={15} /> ฟังยาวตั้งแต่ EP 1
          </button>
        </div>

        <div className="lesson-list">
          {PODCAST_EPISODES.map((ep) => {
            const isActive = currentEpisode?.id === ep.id;
            const isDone = completedPodcasts.includes(ep.id);
            return (
              <button
                key={ep.id}
                type="button"
                className={`pod-ep-row ${isActive ? 'playing' : ''} ${isDone ? 'done' : ''}`}
                onClick={() => (isActive ? onTogglePlay() : onPlayEpisode(ep))}
              >
                <div className="pod-ep-play">
                  {isActive && isPlaying ? <Pause size={17} /> : <Play size={17} />}
                </div>
                <div className="lesson-row-body">
                  <div className="lesson-row-top">
                    <strong>{ep.title}</strong>
                  </div>
                  <div className="lesson-row-sub">
                    <span className="pill sm">{ep.level}</span>
                    <span>{ep.durationLabel}</span>
                    <span>· {ep.pdfPages}</span>
                  </div>
                </div>
                {isDone && <CheckCircle2 size={18} className="jade-text" />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
