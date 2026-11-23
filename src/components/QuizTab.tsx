import { useEffect, useState } from 'react';
import { AlertTriangle, Award, CheckCircle2, Flame, RotateCcw, ShieldAlert, Target, XCircle } from 'lucide-react';
import { QUIZZES } from '../data/quizzes';
import { QuizQuestion } from '../data/types';
import { SpeakButton } from './SpeakButton';

export type QuizMode = 'HSK 1' | 'HSK 2' | 'trap' | 'wrong';

interface QuizTabProps {
  showPinyin: boolean;
  wrongQuizIds: string[];
  solvedQuizIds: string[];
  autoStartWrongSignal: number;
  onRecordAnswer: (quizId: string, isCorrect: boolean) => void;
  onCompleteQuizSession: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function QuizTab({
  showPinyin,
  wrongQuizIds,
  solvedQuizIds,
  autoStartWrongSignal,
  onRecordAnswer,
  onCompleteQuizSession,
}: QuizTabProps) {
  const [activeMode, setActiveMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const startQuiz = (mode: QuizMode) => {
    let pool: QuizQuestion[] = [];
    if (mode === 'wrong') {
      pool = QUIZZES.filter((q) => wrongQuizIds.includes(q.id));
    } else {
      pool = shuffle(QUIZZES.filter((q) => q.category === mode)).slice(0, 15);
    }
    if (pool.length === 0) return;
    setActiveMode(mode);
    setQuestions(pool);
    setIndex(0);
    setSelectedOpt(null);
    setCorrectCount(0);
    setFinished(false);
  };

  useEffect(() => {
    if (autoStartWrongSignal > 0 && wrongQuizIds.length > 0) {
      startQuiz('wrong');
    }
  }, [autoStartWrongSignal]);

  if (activeMode && questions.length > 0) {
    if (finished) {
      const pct = Math.round((correctCount / questions.length) * 100);
      return (
        <div className="card center-card">
          <div className="celebrate-icon">
            <Award size={44} />
          </div>
          <h2>สรุปผลคะแนน ({activeMode === 'wrong' ? 'ทวนข้อผิด' : activeMode})</h2>
          <div className="score-big">
            {correctCount} / {questions.length} ข้อ ({pct}%)
          </div>
          <p className="muted">
            {pct >= 80
              ? 'ยอดเยี่ยม! แม่นยำพร้อมลงสนามสอบแล้วครับ'
              : pct >= 60
                ? 'ผ่านเกณฑ์แล้ว ลองกดทวนข้อที่ผิดอีกนิดจะเป๊ะขึ้นมากครับ'
                : 'ไม่ต้องกังวล ระบบบันทึกข้อที่พลาดไว้ให้กลับมาทวนซ้ำอัตโนมัติแล้วครับ'}
          </p>
          <div className="action-row">
            <button type="button" className="btn-outline" onClick={() => setActiveMode(null)}>
              เลือกโหมดอื่น
            </button>
            <button type="button" className="btn-primary" onClick={() => startQuiz(activeMode)}>
              <RotateCcw size={16} /> ทำชุดนี้อีกครั้ง
            </button>
          </div>
        </div>
      );
    }

    const q = questions[index];
    const answered = selectedOpt !== null;
    const isCorrect = selectedOpt === q.answerIndex;

    return (
      <div className="stack">
        <div className="runner-header">
          <span className="badge badge-red">
            {activeMode === 'wrong' ? 'ทวนข้อผิด' : activeMode} · ข้อ {index + 1}/{questions.length}
          </span>
          <button type="button" className="btn-ghost" onClick={() => setActiveMode(null)}>
            ออกจากควิซ
          </button>
        </div>

        <div className="prog-bar thin">
          <div
            className="prog-fill red"
            style={{ width: `${Math.round(((index + (answered ? 1 : 0)) / questions.length) * 100)}%` }}
          />
        </div>

        <div className="card">
          <div className="card-meta">
            <span className="pill">{q.topic}</span>
            <span className="pill-muted">{q.pdfPage}</span>
          </div>
          <h3 className="quiz-prompt">{q.prompt}</h3>
          {q.zh && (
            <div className="quiz-zh-box">
              <span className="zh-lg">{q.zh}</span>
              <SpeakButton text={q.zh.replace(/______/g, '')} compact />
              {showPinyin && q.pinyin && <div className="pinyin">{q.pinyin}</div>}
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
                    onRecordAnswer(q.id, ok);
                    if (ok) setCorrectCount((c) => c + 1);
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
                <span>{isCorrect ? 'ถูกต้อง!' : 'ยังไม่ถูก'}</span>
              </div>
              <p>{q.explanation}</p>
              <button
                type="button"
                className="btn-primary btn-block"
                onClick={() => {
                  setSelectedOpt(null);
                  if (index + 1 < questions.length) {
                    setIndex((i) => i + 1);
                  } else {
                    onCompleteQuizSession();
                    setFinished(true);
                  }
                }}
              >
                {index + 1 < questions.length ? 'ข้อถัดไป →' : 'ดูสรุปคะแนน'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <h3>คลังควิซจำลองสอบ HSK 1–2</h3>
        <p className="muted">
          ทำไปแล้ว {solvedQuizIds.length} / {QUIZZES.length} ข้อ · ข้อที่ตอบผิดจะถูกเก็บไว้ในโหมดทวนจุดอ่อนให้อัตโนมัติ
        </p>
      </div>

      <div className="quiz-mode-grid">
        <button type="button" className="quiz-mode-card" onClick={() => startQuiz('HSK 1')}>
          <div className="mode-icon red">
            <Target size={22} />
          </div>
          <div className="mode-body">
            <strong>จำลองสอบ HSK 1 (สุ่ม 15 ข้อ)</strong>
            <p className="muted">ตำแหน่ง, 时间, 几/多少, เบอร์โทร, ลักษณนาม, ใน/มี, 会/能/可以</p>
          </div>
        </button>

        <button type="button" className="quiz-mode-card" onClick={() => startQuiz('HSK 2')}>
          <div className="mode-icon jade">
            <Flame size={22} />
          </div>
          <div className="mode-body">
            <strong>จำลองสอบ HSK 2 (สุ่ม 15 ข้อ)</strong>
            <p className="muted">的/地/得, 了/着/过, 比/不如, 是...的, 离/对, สันธานเชื่อมประโยค</p>
          </div>
        </button>

        <button type="button" className="quiz-mode-card" onClick={() => startQuiz('trap')}>
          <div className="mode-icon amber">
            <AlertTriangle size={22} />
          </div>
          <div className="mode-body">
            <strong>จับจุดหลอกออกสอบ (Trap Drill 15 ข้อ)</strong>
            <p className="muted">รวมจุดที่คนไทยพลาดบ่อย: V不V+吗, 还是/或者, 再/又, 就/才, 呢/吧/了</p>
          </div>
        </button>

        <button
          type="button"
          className={`quiz-mode-card ${wrongQuizIds.length === 0 ? 'disabled' : ''}`}
          disabled={wrongQuizIds.length === 0}
          onClick={() => startQuiz('wrong')}
        >
          <div className="mode-icon warn">
            <ShieldAlert size={22} />
          </div>
          <div className="mode-body">
            <strong>ทวนข้อที่เคยตอบผิด ({wrongQuizIds.length} ข้อ)</strong>
            <p className="muted">
              {wrongQuizIds.length > 0
                ? 'ฝึกซ้ำเฉพาะข้อที่พลาดจนกว่าจะตอบถูกหมด'
                : 'ยังไม่มีข้อที่ตอบผิดค้างอยู่ เยี่ยมมาก!'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
