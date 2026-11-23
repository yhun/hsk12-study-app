import { useState } from 'react';
import { BookOpen, Eye, EyeOff, Flame, Headphones, Layers, Settings, Target } from 'lucide-react';
import { DailyTab } from './components/DailyTab';
import { FlashcardsTab } from './components/FlashcardsTab';
import { LessonsTab } from './components/LessonsTab';
import { MiniPodcastBar } from './components/MiniPodcastBar';
import { QuizTab } from './components/QuizTab';
import { SettingsModal } from './components/SettingsModal';
import { SkillsTab } from './components/SkillsTab';
import { SkillMode } from './data/types';
import { usePodcastPlayer } from './hooks/usePodcastPlayer';
import { useProgress } from './hooks/useProgress';

type TabKey = 'daily' | 'lessons' | 'skills' | 'flashcards' | 'quiz';

export function App() {
  const {
    progress,
    studiedToday,
    recordStudyToday,
    toggleLessonComplete,
    markAntonym,
    markRadical,
    recordQuizAnswer,
    markSkillItem,
    setSessionMinutes,
    toggleShowPinyin,
    importProgress,
    resetProgress,
  } = useProgress();

  const podcast = usePodcastPlayer({
    onCompleteEpisode: (epId) => markSkillItem('podcast', epId),
  });

  const [tab, setTab] = useState<TabKey>('daily');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillMode>('listening');
  const [wrongQuizSignal, setWrongQuizSignal] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openLessonFromDaily = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setTab('lessons');
  };

  const openSkillFromDaily = (skill: SkillMode) => {
    setSelectedSkill(skill);
    setTab('skills');
  };

  const openWrongQuizzes = () => {
    setTab('quiz');
    if (progress.wrongQuizIds.length > 0) {
      setWrongQuizSignal((s) => s + 1);
    }
  };

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand" onClick={() => setTab('daily')} role="button" tabIndex={0}>
            <div className="brand-mark">汉</div>
            <div>
              <div className="brand-title">HSK 1–2 ติวสอบทุกวัน</div>
              <div className="brand-sub">อิงชีทสรุป 155 หน้า · วันละกี่นาทีก็ได้</div>
            </div>
          </div>

          <nav className="desktop-nav" aria-label="เมนูหลัก">
            <button type="button" className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>
              <Flame size={16} /> วันนี้
            </button>
            <button type="button" className={tab === 'lessons' ? 'active' : ''} onClick={() => setTab('lessons')}>
              <BookOpen size={16} /> บทเรียน
            </button>
            <button type="button" className={tab === 'skills' ? 'active' : ''} onClick={() => setTab('skills')}>
              <Headphones size={16} /> 4 ทักษะ
            </button>
            <button type="button" className={tab === 'flashcards' ? 'active' : ''} onClick={() => setTab('flashcards')}>
              <Layers size={16} /> แฟลชการ์ด
            </button>
            <button type="button" className={tab === 'quiz' ? 'active' : ''} onClick={() => setTab('quiz')}>
              <Target size={16} /> ฝึกสอบ
            </button>
          </nav>

          <div className="topbar-actions">
            <div className={`streak-pill ${studiedToday ? 'lit' : ''}`} title="จำนวนวันต่อเนื่อง">
              <Flame size={15} />
              <span>{progress.streak}</span>
            </div>
            <button
              type="button"
              className={`btn-pinyin ${progress.showPinyin ? 'on' : ''}`}
              onClick={toggleShowPinyin}
              title={progress.showPinyin ? 'ซ่อนพินอิน (ฝึกอ่านตัวจีน)' : 'แสดงพินอิน'}
            >
              {progress.showPinyin ? <Eye size={15} /> : <EyeOff size={15} />}
              <span className="hide-xs">{progress.showPinyin ? 'Pinyin' : 'ซ่อน Pinyin'}</span>
            </button>
            <button
              type="button"
              className="btn-icon-sm"
              onClick={() => setSettingsOpen(true)}
              aria-label="ตั้งค่า"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-container">
        {tab === 'daily' && (
          <DailyTab
            progress={progress}
            studiedToday={studiedToday}
            onSetSessionMinutes={setSessionMinutes}
            onCompleteLesson={toggleLessonComplete}
            onMarkAntonym={markAntonym}
            onRecordQuiz={recordQuizAnswer}
            onFinishDailySession={() => recordStudyToday(true)}
            onOpenWrongQuizzes={openWrongQuizzes}
            onOpenLesson={openLessonFromDaily}
            onOpenSkill={openSkillFromDaily}
          />
        )}

        {tab === 'lessons' && (
          <LessonsTab
            completedLessons={progress.completedLessons}
            showPinyin={progress.showPinyin}
            selectedLessonId={selectedLessonId}
            onSelectLesson={setSelectedLessonId}
            onToggleComplete={toggleLessonComplete}
          />
        )}

        {tab === 'skills' && (
          <SkillsTab
            progress={progress}
            activeSkill={selectedSkill}
            onChangeSkill={setSelectedSkill}
            onMarkSkill={markSkillItem}
            podcast={podcast}
          />
        )}

        {tab === 'flashcards' && (
          <FlashcardsTab
            showPinyin={progress.showPinyin}
            masteredAntonyms={progress.masteredAntonyms}
            reviewAntonyms={progress.reviewAntonyms}
            masteredRadicals={progress.masteredRadicals}
            onMarkAntonym={markAntonym}
            onMarkRadical={markRadical}
          />
        )}

        {tab === 'quiz' && (
          <QuizTab
            showPinyin={progress.showPinyin}
            wrongQuizIds={progress.wrongQuizIds}
            solvedQuizIds={progress.solvedQuizIds}
            autoStartWrongSignal={wrongQuizSignal}
            onRecordAnswer={recordQuizAnswer}
            onCompleteQuizSession={() => recordStudyToday(false)}
          />
        )}
      </main>

      {/* Persistent Mini Podcast Player */}
      {podcast.currentEpisode && !(tab === 'skills' && selectedSkill === 'podcast') && (
        <MiniPodcastBar
          episode={podcast.currentEpisode}
          isPlaying={podcast.isPlaying}
          onTogglePlay={podcast.togglePlay}
          onNext={podcast.nextEpisode}
          onOpenPodcast={() => {
            setSelectedSkill('podcast');
            setTab('skills');
          }}
          onClose={podcast.stopAndClose}
        />
      )}

      {/* Bottom Navigation (Mobile) */}
      <nav className="mobile-nav" aria-label="แถบนำทางมือถือ">
        <button type="button" className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>
          <Flame size={19} />
          <span>วันนี้</span>
        </button>
        <button type="button" className={tab === 'lessons' ? 'active' : ''} onClick={() => setTab('lessons')}>
          <BookOpen size={19} />
          <span>บทเรียน</span>
        </button>
        <button type="button" className={tab === 'skills' ? 'active' : ''} onClick={() => setTab('skills')}>
          <Headphones size={19} />
          <span>4 ทักษะ</span>
        </button>
        <button type="button" className={tab === 'flashcards' ? 'active' : ''} onClick={() => setTab('flashcards')}>
          <Layers size={19} />
          <span>การ์ด</span>
        </button>
        <button type="button" className={tab === 'quiz' ? 'active' : ''} onClick={() => setTab('quiz')}>
          <Target size={19} />
          <span>ฝึกสอบ</span>
        </button>
      </nav>

      <SettingsModal
        open={settingsOpen}
        progress={progress}
        onClose={() => setSettingsOpen(false)}
        onImport={importProgress}
        onReset={resetProgress}
      />
    </div>
  );
}

export default App;
