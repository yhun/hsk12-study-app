import { useCallback, useEffect, useRef, useState } from 'react';
import { PODCAST_EPISODES } from '../data/podcasts';
import { PodcastEpisode } from '../data/types';

export type SleepTimerMode = 'off' | '10' | '20' | 'episode';

interface UsePodcastPlayerOptions {
  onCompleteEpisode: (epId: string) => void;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function usePodcastPlayer({ onCompleteEpisode }: UsePodcastPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<0.75 | 1 | 1.25>(1);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [sleepTimer, setSleepTimer] = useState<SleepTimerMode>('off');
  const [sleepMinutesLeft, setSleepMinutesLeft] = useState<number | null>(null);

  const markedDoneRef = useRef<Set<string>>(new Set());
  const autoPlayNextRef = useRef(autoPlayNext);
  const sleepTimerRef = useRef(sleepTimer);
  const onCompleteRef = useRef(onCompleteEpisode);

  useEffect(() => {
    autoPlayNextRef.current = autoPlayNext;
  }, [autoPlayNext]);

  useEffect(() => {
    sleepTimerRef.current = sleepTimer;
  }, [sleepTimer]);

  useEffect(() => {
    onCompleteRef.current = onCompleteEpisode;
  }, [onCompleteEpisode]);

  const currentEpisode: PodcastEpisode | null =
    PODCAST_EPISODES.find((ep) => ep.id === currentId) ?? null;

  const ensureAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'metadata';
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const playEpisode = useCallback(
    (episode: PodcastEpisode) => {
      const audio = ensureAudio();
      const sameTrack = currentId === episode.id;
      if (!sameTrack) {
        audio.src = episode.audioFile;
        audio.currentTime = 0;
        setCurrentTime(0);
        setDuration(0);
        setCurrentId(episode.id);
      }
      audio.playbackRate = playbackRate;
      if ('preservesPitch' in audio) {
        audio.preservesPitch = true;
      }
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    },
    [currentId, ensureAudio, playbackRate]
  );

  const togglePlay = useCallback(() => {
    const audio = ensureAudio();
    if (!currentEpisode) {
      playEpisode(PODCAST_EPISODES[0]);
      return;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentEpisode, ensureAudio, isPlaying, playEpisode, playbackRate]);

  const seekTo = useCallback(
    (seconds: number) => {
      const audio = ensureAudio();
      const clamped = Math.max(0, Math.min(seconds, duration || audio.duration || 0));
      audio.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration, ensureAudio]
  );

  const skipBy = useCallback(
    (delta: number) => {
      const audio = ensureAudio();
      seekTo((audio.currentTime || 0) + delta);
    },
    [ensureAudio, seekTo]
  );

  const nextEpisode = useCallback(() => {
    if (!currentEpisode) {
      playEpisode(PODCAST_EPISODES[0]);
      return;
    }
    const idx = PODCAST_EPISODES.findIndex((ep) => ep.id === currentEpisode.id);
    const next = PODCAST_EPISODES[(idx + 1) % PODCAST_EPISODES.length];
    playEpisode(next);
  }, [currentEpisode, playEpisode]);

  const prevEpisode = useCallback(() => {
    if (!currentEpisode) {
      playEpisode(PODCAST_EPISODES[0]);
      return;
    }
    const idx = PODCAST_EPISODES.findIndex((ep) => ep.id === currentEpisode.id);
    const prev = PODCAST_EPISODES[(idx - 1 + PODCAST_EPISODES.length) % PODCAST_EPISODES.length];
    playEpisode(prev);
  }, [currentEpisode, playEpisode]);

  const stopAndClose = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentId(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const changePlaybackRate = useCallback(
    (rate: 0.75 | 1 | 1.25) => {
      setPlaybackRate(rate);
      const audio = audioRef.current;
      if (audio) {
        audio.playbackRate = rate;
        if ('preservesPitch' in audio) {
          audio.preservesPitch = true;
        }
      }
    },
    []
  );

  const chooseSleepTimer = useCallback((mode: SleepTimerMode) => {
    setSleepTimer(mode);
    if (mode === '10') setSleepMinutesLeft(10);
    else if (mode === '20') setSleepMinutesLeft(20);
    else setSleepMinutesLeft(null);
  }, []);

  // Wire audio element events
  useEffect(() => {
    const audio = ensureAudio();

    const onTimeUpdate = () => {
      const t = audio.currentTime || 0;
      const d = audio.duration || 0;
      setCurrentTime(t);
      if (d > 0 && currentId && !markedDoneRef.current.has(currentId) && t / d >= 0.8) {
        markedDoneRef.current.add(currentId);
        onCompleteRef.current(currentId);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    const onEnded = () => {
      if (currentId && !markedDoneRef.current.has(currentId)) {
        markedDoneRef.current.add(currentId);
        onCompleteRef.current(currentId);
      }
      if (sleepTimerRef.current === 'episode') {
        setIsPlaying(false);
        setSleepTimer('off');
        return;
      }
      if (autoPlayNextRef.current && currentId) {
        const idx = PODCAST_EPISODES.findIndex((ep) => ep.id === currentId);
        if (idx >= 0 && idx + 1 < PODCAST_EPISODES.length) {
          const next = PODCAST_EPISODES[idx + 1];
          audio.src = next.audioFile;
          audio.currentTime = 0;
          setCurrentTime(0);
          setDuration(0);
          setCurrentId(next.id);
          audio
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
          return;
        }
      }
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentId, ensureAudio]);

  // Minute countdown for timed sleep timer
  useEffect(() => {
    if (sleepTimer !== '10' && sleepTimer !== '20') return;
    if (!isPlaying) return;

    const timerId = window.setInterval(() => {
      setSleepMinutesLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          audioRef.current?.pause();
          setIsPlaying(false);
          setSleepTimer('off');
          return null;
        }
        return prev - 1;
      });
    }, 60_000);

    return () => window.clearInterval(timerId);
  }, [sleepTimer, isPlaying]);

  // Lock screen & Bluetooth headphone Media Session integration
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !currentEpisode) {
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentEpisode.title,
        artist: 'พอดแคสต์ครูสอนจีน · HSK 1–2',
        album: '汉语天天练',
      });
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('seekbackward', () => skipBy(-15));
      navigator.mediaSession.setActionHandler('seekforward', () => skipBy(15));
      navigator.mediaSession.setActionHandler('previoustrack', () => prevEpisode());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextEpisode());
    } catch {
      // Ignore unsupported MediaSession actions
    }
  }, [currentEpisode, nextEpisode, prevEpisode, skipBy, togglePlay]);

  return {
    episodes: PODCAST_EPISODES,
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    autoPlayNext,
    sleepTimer,
    sleepMinutesLeft,
    playEpisode,
    togglePlay,
    seekTo,
    skipBy,
    nextEpisode,
    prevEpisode,
    stopAndClose,
    setAutoPlayNext,
    changePlaybackRate,
    chooseSleepTimer,
  };
}
