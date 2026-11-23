import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Headphones,
  Layers,
  Mic,
  PenTool,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react';
import { ANTONYMS } from '../data/antonyms';
import { LESSONS } from '../data/lessons';
import { QUIZZES } from '../data/quizzes';
import { RADICALS } from '../data/radicals';
import {
  LISTENING_ITEMS,
  READING_PASSAGES,
  SENTENCE_BUILDERS,
  SPEAKING_ITEMS,
  WRITING_CHARS,
} from '../data/skills';
import { SessionMinutes, SkillMode, UserProgress } from '../data/types';
import { getLocalDateStr } from '../hooks/useProgress';
import { SpeakButton } from './SpeakButton';

interface DailyTabProps {
  progress: UserProgress;
  studiedToday: boolean;
  onSetSessionMinutes: (m: SessionMinutes) => void;
  onCompleteLesson: (id: string, force?: boolean) => void;
  onMarkAntonym: (id: string, status: 'mastered' | 'review') => void;
  onRecordQuiz: (id: string, isCorrect: boolean) => void;
  onFinishDailySession: () => void;
  onOpenWrongQuizzes: () => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenSkill: (skill: SkillMode) => void;
}

const DURATION_CONFIG: Record<
  SessionMinutes,
  { label: string; desc: string; lessons: number; antonyms: number; quizzes: number }
> = {
  3: { label: '3 นาที', desc: 'รักษาวินัยไวสุด', lessons: 1, antonyms: 3, quizzes: 3 },
  5: { label: '5 นาที', desc: 'แนะนำทุกวัน', lessons: 1, antonyms: 5, quizzes: 5 },
  10: { label: '10 นาที', desc: 'กำลังดี', lessons: 1, antonyms: 8, quizzes: 8 },
  15: { label: '15 นาที', desc: 'เร่งสปีดสอบ', lessons: 2, antonyms: 12, quizzes: 10 },
};

const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export function DailyTab({
  progress,
  studiedToday,
  onSetSessionMinutes,
  onCompleteLesson,
  onMarkAntonym,
  onRecordQuiz,
  onFinishDailySession,
  onOpenWrongQuizzes,
  onOpenLesson,
  onOpenSkill,
}: DailyTabProps) {
  const [runnerActive, setRunnerActive] = useState(false);
  const [phase, setPhase] = useState<'lesson' | 'antonym' | 'quiz' | 'done'>('lesson');
  const [lessonIdx, setLessonIdx] = useState(0);
  const [antIdx, setAntIdx] = useState(0);
  const [antFlipped, setAntFlipped] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);

  const cfg = DURATION_CONFIG[progress.sessionMinutes];

  // Build today's mission items deterministically from current progress
  const sessionLessons = useMemo(() => {
    const uncompleted = LESSONS.filter((l) => !progress.completedLessons.includes(l.id));
    const pool = uncompleted.length > 0 ? uncompleted : LESSONS;
    return pool.slice(0, cfg.lessons);
  }, [progress.completedLessons, cfg.lessons]);

  const sessionAntonyms = useMemo(() => {
    const reviewFirst = ANTONYMS.filter((a) => progress.reviewAntonyms.includes(a.id));
    const unmastered = ANTONYMS.filter(
      (a) => !progress.masteredAntonyms.includes(a.id) && !progress.reviewAntonyms.includes(a.id)
    );
    const fallback = ANTONYMS;
    const combined = [...reviewFirst, ...unmastered];
    const source = combined.length >= cfg.antonyms ? combined : [...combined, ...fallback];
    const unique: typeof ANTONYMS = [];
    for (const item of source) {
      if (!unique.some((u) => u.id === item.id)) unique.push(item);
      if (unique.length >= cfg.antonyms) break;
    }
    return unique;
  }, [progress.reviewAntonyms, progress.masteredAntonyms, cfg.antonyms]);

  const sessionQuizzes = useMemo(() => {
    const wrongFirst = QUIZZES.filter((q) => progress.wrongQuizIds.includes(q.id));
    const unsolved = QUIZZES.filter(
      (q) => !progress.solvedQuizIds.includes(q.id) && !progress.wrongQuizIds.includes(q.id)
    );
    const source = [...wrongFirst, ...unsolved, ...QUIZZES];
    const unique: typeof QUIZZES = [];
    for (const q of source) {
      if (!unique.some((u) => u.id === q.id)) unique.push(q);
      if (unique.length >= cfg.quizzes) break;
    }
    return unique;
  }, [progress.wrongQuizIds, progress.solvedQuizIds, cfg.quizzes]);

  const last7Days = useMemo(() => {
    const days: { dateStr: string; label: string; active: boolean; isToday: boolean }[] = [];
    const todayStr = getLocalDateStr();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const dateStr = getLocalDateStr(d);
      days.push({
        dateStr,
        label: THAI_DAYS[d.getDay()],
        active: progress.studyDates.includes(dateStr),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [progress.studyDates]);

  const startSession = () => {
    setRunnerActive(true);
    setPhase('lesson');
    setLessonIdx(0);
    setAntIdx(0);
    setAntFlipped(false);
    setQuizIdx(0);
    setSelectedOpt(null);
    setQuizCorrectCount(0);
  };

  if (runnerActive) {
    if (phase === 'lesson') {
      const lesson = sessionLessons[lessonIdx];
      return (
        <div className="stack">
          <div className="runner-header">
            <span className="badge badge-red">
              ขั้นที่ 1/3 · บทเรียน ({lessonIdx + 1}/{sessionLessons.length})
            </span>
            <button type="button" className="btn-ghost" onClick={() => setRunnerActive(false)}>
              ออกชั่วคราว
            </button>
          </div>

          <div className="card">
            <div className="card-meta">
              <span className="pill">{lesson.level}</span>
              <span className="pill-muted">{lesson.pdfPages}</span>
            </div>
            <h2 className="lesson-title">{lesson.title}</h2>
            <p className="muted">{lesson.subtitle}</p>
            <p className="summary-box">{lesson.summary}</p>

            <h3 className="section-label">โครงสร้างสำคัญ</h3>
            <div className="formula-list">
              {lesson.structures.map((st, idx) => (
                <div key={idx} className="formula-pill">
                  {st}
                </div>
              ))}
            </div>

            <h3 className="section-label">สรุปประเด็นสอบ</h3>
            <ul className="bullet-list">
              {lesson.points.map((pt, idx) => (
                <li key={idx}>{pt}</li>
              ))}
            </ul>

            <h3 className="section-label">ตัวอย่างประโยค</h3>
            <div className="example-list">
              {lesson.examples.map((ex, idx) => (
                <div key={idx} className="example-card">
                  <div className="example-top">
                    <span className="zh-lg">{ex.zh}</span>
                    <SpeakButton text={ex.zh} compact showSlow />
                  </div>
                  {progress.showPinyin && <div className="pinyin">{ex.pinyin}</div>}
                  <div className="th-text">{ex.th}</div>
                </div>
              ))}
            </div>

            <div className="tip-box">
              <strong>จุดเน้นห้องสอบ:</strong> {lesson.examTip}
            </div>

            <button
              type="button"
              className="btn-primary btn-block"
              onClick={() => {
                onCompleteLesson(lesson.id, true);
                if (lessonIdx + 1 < sessionLessons.length) {
                  setLessonIdx((i) => i + 1);
                } else {
                  setPhase('antonym');
                }
              }}
            >
              <span>
                {lessonIdx + 1 < sessionLessons.length
                  ? 'เข้าใจแล้ว ไปบทถัดไป'
                  : 'เข้าใจแล้ว ไปทวนคำตรงข้าม →'}
              </span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      );
    }

    if (phase === 'antonym') {
      const pair = sessionAntonyms[antIdx];
      return (
        <div className="stack">
          <div className="runner-header">
            <span className="badge badge-jade">
              ขั้นที่ 2/3 · คำตรงข้าม ({antIdx + 1}/{sessionAntonyms.length})
            </span>
            <button type="button" className="btn-ghost" onClick={() => setRunnerActive(false)}>
              ออกชั่วคราว
            </button>
          </div>

          <div
            className={`flashcard ${antFlipped ? 'is-flipped' : ''}`}
            onClick={() => setAntFlipped((f) => !f)}
            role="button"
            tabIndex={0}
          >
            <div className="flashcard-badge">ชีทหน้า {pair.page} · แตะเพื่อพลิกดูคำแปล</div>
            <div className="antonym-pair">
              <div className="antonym-side">
                <div className="zh-hero">{pair.left.zh}</div>
                {progress.showPinyin && <div className="pinyin">{pair.left.pinyin}</div>}
                <SpeakButton text={pair.left.zh} compact />
              </div>
              <div className="vs-divider">↔</div>
              <div className="antonym-side">
                <div className="zh-hero">{pair.right.zh}</div>
                {progress.showPinyin && <div className="pinyin">{pair.right.pinyin}</div>}
                <SpeakButton text={pair.right.zh} compact />
              </div>
            </div>

            {antFlipped ? (
              <div className="flashcard-answer">
                <div>
                  <strong>{pair.left.zh}</strong> = {pair.left.th}
                </div>
                <div>
                  <strong>{pair.right.zh}</strong> = {pair.right.th}
                </div>
              </div>
            ) : (
              <div className="tap-hint">แตะการ์ดเพื่อเฉลยความหมาย</div>
            )}
          </div>

          <div className="action-row">
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                onMarkAntonym(pair.id, 'review');
                setAntFlipped(false);
                if (antIdx + 1 < sessionAntonyms.length) {
                  setAntIdx((i) => i + 1);
                } else {
                  setPhase('quiz');
                }
              }}
            >
              <RotateCcw size={16} />
              <span>ยังต้องทวน</span>
            </button>
            <button
              type="button"
              className="btn-jade"
              onClick={() => {
                onMarkAntonym(pair.id, 'mastered');
                setAntFlipped(false);
                if (antIdx + 1 < sessionAntonyms.length) {
                  setAntIdx((i) => i + 1);
                } else {
                  setPhase('quiz');
                }
              }}
            >
              <CheckCircle2 size={16} />
              <span>จำได้แล้ว ✓</span>
            </button>
          </div>
        </div>
      );
    }

    if (phase === 'quiz') {
      const q = sessionQuizzes[quizIdx];
      const answered = selectedOpt !== null;
      const isCorrect = selectedOpt === q.answerIndex;

      return (
        <div className="stack">
          <div className="runner-header">
            <span className="badge badge-amber">
              ขั้นที่ 3/3 · ควิซวัดผล ({quizIdx + 1}/{sessionQuizzes.length})
            </span>
            <button type="button" className="btn-ghost" onClick={() => setRunnerActive(false)}>
              ออกชั่วคราว
            </button>
          </div>

          <div className="card">
            <div className="card-meta">
              <span className="pill">{q.category}</span>
              <span className="pill-muted">{q.topic}</span>
            </div>
            <h3 className="quiz-prompt">{q.prompt}</h3>
            {q.zh && (
              <div className="quiz-zh-box">
                <span className="zh-lg">{q.zh}</span>
                <SpeakButton text={q.zh.replace(/______/g, '')} compact />
                {progress.showPinyin && q.pinyin && <div className="pinyin">{q.pinyin}</div>}
              </div>
            )}

            <div className="options-list">
              {q.options.map((opt, idx) => {
                let cls = 'option-btn';
                if (answered) {
                  if (idx === q.answerIndex) cls += ' is-correct';
                  else if (idx === selectedOpt) cls += ' is-wrong';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    className={cls}
                    disabled={answered}
                    onClick={() => {
                      setSelectedOpt(idx);
                      const ok = idx === q.answerIndex;
                      onRecordQuiz(q.id, ok);
                      if (ok) setQuizCorrectCount((c) => c + 1);
                    }}
                  >
                    <span className="opt-letter">{String.fromCharCode(65 + idx)}.</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className={`feedback-box ${isCorrect ? 'ok' : 'err'}`}>
                <div className="feedback-title">
                  {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  <span>{isCorrect ? 'ถูกต้อง!' : 'ยังไม่ถูก ลองดูเฉลยกันครับ'}</span>
                </div>
                <p>{q.explanation}</p>
                <button
                  type="button"
                  className="btn-primary btn-block"
                  onClick={() => {
                    setSelectedOpt(null);
                    if (quizIdx + 1 < sessionQuizzes.length) {
                      setQuizIdx((i) => i + 1);
                    } else {
                      onFinishDailySession();
                      setPhase('done');
                    }
                  }}
                >
                  {quizIdx + 1 < sessionQuizzes.length ? 'ข้อถัดไป →' : 'สรุปภารกิจวันนี้ 🎉'}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="card center-card">
        <div className="celebrate-icon">
          <Award size={44} />
        </div>
        <h2>เก่งมาก! ทำภารกิจวันนี้ครบแล้ว</h2>
        <p className="muted">
          ตอบถูก {quizCorrectCount} จาก {sessionQuizzes.length} ข้อ · ความสม่ำเสมอคือกุญแจสอบผ่าน HSK!
        </p>
        <div className="streak-banner">
          <Flame size={22} />
          <span>Streak ปัจจุบัน: {progress.streak} วันต่อเนื่อง</span>
        </div>
        <button type="button" className="btn-primary btn-block" onClick={() => setRunnerActive(false)}>
          กลับหน้าหลักวันนี้
        </button>
      </div>
    );
  }

  const lessonPct = Math.round((progress.completedLessons.length / LESSONS.length) * 100);
  const antPct = Math.round((progress.masteredAntonyms.length / ANTONYMS.length) * 100);
  const radPct = Math.round((progress.masteredRadicals.length / RADICALS.length) * 100);

  return (
    <div className="stack">
      {/* Streak Hero */}
      <section className="hero-card">
        <div className="hero-top">
          <div>
            <div className="hero-eyebrow">
              {studiedToday ? 'ภารกิจวันนี้สำเร็จแล้ว ✓' : 'พร้อมเก็บ Streak วันนี้'}
            </div>
            <h2 className="hero-title">
              <Flame className="flame-icon" size={26} />
              <span>{progress.streak} วันต่อเนื่อง</span>
            </h2>
          </div>
          <div className="session-badge">
            <Sparkles size={16} />
            <span>ทำครบ {progress.totalSessionsCompleted} รอบ</span>
          </div>
        </div>

        <div className="week-dots">
          {last7Days.map((d) => (
            <div key={d.dateStr} className={`day-chip ${d.active ? 'active' : ''} ${d.isToday ? 'today' : ''}`}>
              <span className="day-dot">{d.active ? '✓' : ''}</span>
              <span className="day-label">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Flexible Time Picker + 1-Click Mission */}
      <section className="card">
        <div className="section-head">
          <div>
            <h3>ภารกิจวันนี้ (เลือกเวลาตามที่สะดวก)</h3>
            <p className="muted">วันไหนยุ่งเลือก 3 นาที วันไหนว่างเลือก 10–15 นาทีได้เลยครับ</p>
          </div>
        </div>

        <div className="duration-grid">
          {([3, 5, 10, 15] as SessionMinutes[]).map((m) => {
            const active = progress.sessionMinutes === m;
            return (
              <button
                key={m}
                type="button"
                className={`duration-btn ${active ? 'active' : ''}`}
                onClick={() => onSetSessionMinutes(m)}
              >
                <span className="dur-time">
                  <Clock size={14} /> {DURATION_CONFIG[m].label}
                </span>
                <span className="dur-desc">{DURATION_CONFIG[m].desc}</span>
              </button>
            );
          })}
        </div>

        <div className="mission-preview">
          <div className="preview-item">
            <BookOpen size={16} />
            <span>
              <strong>{cfg.lessons} บทเรียน:</strong> {sessionLessons[0]?.title}
            </span>
          </div>
          <div className="preview-item">
            <Layers size={16} />
            <span>
              <strong>{cfg.antonyms} คู่คำตรงข้าม</strong> (จากหน้า 123–137)
            </span>
          </div>
          <div className="preview-item">
            <Target size={16} />
            <span>
              <strong>{cfg.quizzes} ข้อควิซ</strong> (ดึงข้อที่เคยพลาดมาทวนให้ก่อน)
            </span>
          </div>
        </div>

        <button type="button" className="btn-primary btn-block" onClick={startSession}>
          <Play size={18} />
          <span>{studiedToday ? `ฝึกเพิ่มอีก ${cfg.label} ทันที` : `เริ่มภารกิจวันนี้ (${cfg.label})`}</span>
        </button>
      </section>

      {/* Shortcut for Mistakes & Next Lesson */}
      <section className="quick-grid">
        <button
          type="button"
          className="quick-card"
          onClick={() => onOpenLesson(sessionLessons[0].id)}
        >
          <span className="quick-label">บทถัดไปที่แนะนำ</span>
          <strong>{sessionLessons[0]?.title}</strong>
          <span className="muted">{sessionLessons[0]?.level} · {sessionLessons[0]?.pdfPages}</span>
        </button>

        <button
          type="button"
          className="quick-card warn"
          onClick={onOpenWrongQuizzes}
        >
          <span className="quick-label">จุดอ่อนที่ต้องซ่อม</span>
          <strong>
            {progress.wrongQuizIds.length > 0
              ? `ทวน ${progress.wrongQuizIds.length} ข้อที่เคยผิด`
              : 'ยังไม่มีข้อผิดสะสม 🎉'}
          </strong>
          <span className="muted">กดเพื่อฝึกซ้ำเฉพาะข้อที่พลาด</span>
        </button>
      </section>

      {/* 4-Skill Quick Launcher */}
      <section className="card">
        <div className="section-head mb-12">
          <div>
            <h3>ฝึก 4 ทักษะ (ฟัง · พูด · อ่าน · เขียน)</h3>
            <p className="muted">เลือกทักษะที่อยากฝึกเสริมได้ทันทีทุกวัน</p>
          </div>
        </div>
        <div className="skill-quick-grid">
          <button type="button" className="skill-quick-card" onClick={() => onOpenSkill('listening')}>
            <div className="mode-icon red">
              <Headphones size={20} />
            </div>
            <div>
              <strong>ฟัง (Listening)</strong>
              <div className="muted">
                {progress.completedListening.length}/{LISTENING_ITEMS.length} ข้อ
              </div>
            </div>
          </button>

          <button type="button" className="skill-quick-card" onClick={() => onOpenSkill('speaking')}>
            <div className="mode-icon jade">
              <Mic size={20} />
            </div>
            <div>
              <strong>พูด (Speaking)</strong>
              <div className="muted">
                {progress.completedSpeaking.length}/{SPEAKING_ITEMS.length} ประโยค
              </div>
            </div>
          </button>

          <button type="button" className="skill-quick-card" onClick={() => onOpenSkill('reading')}>
            <div className="mode-icon amber">
              <BookOpen size={20} />
            </div>
            <div>
              <strong>อ่าน (Reading)</strong>
              <div className="muted">
                {progress.completedReading.length}/{READING_PASSAGES.length} บท
              </div>
            </div>
          </button>

          <button type="button" className="skill-quick-card" onClick={() => onOpenSkill('writing')}>
            <div className="mode-icon warn">
              <PenTool size={20} />
            </div>
            <div>
              <strong>เขียน (Writing)</strong>
              <div className="muted">
                {progress.practicedWriting.length + progress.completedSentences.length}/
                {WRITING_CHARS.length + SENTENCE_BUILDERS.length} รายการ
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Overall Mastery Progress */}
      <section className="card">
        <h3 className="mb-12">ความคืบหน้าคลังความรู้ HSK 1–2</h3>
        <div className="progress-stack">
          <div className="prog-row">
            <div className="prog-label">
              <span>บทเรียนไวยากรณ์ (6 ช่วง)</span>
              <span>
                {progress.completedLessons.length} / {LESSONS.length} บท ({lessonPct}%)
              </span>
            </div>
            <div className="prog-bar">
              <div className="prog-fill red" style={{ width: `${lessonPct}%` }} />
            </div>
          </div>

          <div className="prog-row">
            <div className="prog-label">
              <span>คำศัพท์ตรงข้าม (反义词)</span>
              <span>
                {progress.masteredAntonyms.length} / {ANTONYMS.length} คู่ ({antPct}%)
              </span>
            </div>
            <div className="prog-bar">
              <div className="prog-fill jade" style={{ width: `${antPct}%` }} />
            </div>
          </div>

          <div className="prog-row">
            <div className="prog-label">
              <span>หมวดนำอักษร / รากศัพท์ (偏旁部首)</span>
              <span>
                {progress.masteredRadicals.length} / {RADICALS.length} หมวด ({radPct}%)
              </span>
            </div>
            <div className="prog-bar">
              <div className="prog-fill amber" style={{ width: `${radPct}%` }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
