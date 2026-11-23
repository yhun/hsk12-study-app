import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, Circle, Sparkles, XCircle } from 'lucide-react';
import { LESSONS } from '../data/lessons';
import { Lesson } from '../data/types';
import { SpeakButton } from './SpeakButton';

interface LessonsTabProps {
  completedLessons: string[];
  showPinyin: boolean;
  selectedLessonId: string | null;
  onSelectLesson: (id: string | null) => void;
  onToggleComplete: (id: string, force?: boolean) => void;
}

export function LessonsTab({
  completedLessons,
  showPinyin,
  selectedLessonId,
  onSelectLesson,
  onToggleComplete,
}: LessonsTabProps) {
  const [filter, setFilter] = useState<'ALL' | 'HSK 1' | 'HSK 2' | 'HSK 1-2'>('ALL');
  const [miniAnswers, setMiniAnswers] = useState<Record<string, number>>({});

  const selectedLesson = useMemo(
    () => LESSONS.find((l) => l.id === selectedLessonId) ?? null,
    [selectedLessonId]
  );

  const stages = useMemo(() => {
    const filtered = filter === 'ALL' ? LESSONS : LESSONS.filter((l) => l.level === filter);
    const map = new Map<number, { title: string; items: Lesson[] }>();
    for (const lesson of filtered) {
      const existing = map.get(lesson.stage);
      if (existing) {
        existing.items.push(lesson);
      } else {
        map.set(lesson.stage, { title: lesson.stageTitle, items: [lesson] });
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filter]);

  if (selectedLesson) {
    const isDone = completedLessons.includes(selectedLesson.id);
    const currentIndex = LESSONS.findIndex((l) => l.id === selectedLesson.id);
    const nextLesson = currentIndex >= 0 && currentIndex + 1 < LESSONS.length ? LESSONS[currentIndex + 1] : null;

    return (
      <div className="stack">
        <div className="runner-header">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setMiniAnswers({});
              onSelectLesson(null);
            }}
          >
            <ArrowLeft size={16} />
            <span>กลับหน้ารายการบทเรียน</span>
          </button>
          <span className="pill-muted">{selectedLesson.pdfPages}</span>
        </div>

        <div className="card">
          <div className="card-meta">
            <span className="pill">{selectedLesson.level}</span>
            <span className="pill-muted">~{selectedLesson.estimatedMinutes} นาที</span>
            {isDone && <span className="badge badge-jade">เรียนจบแล้ว ✓</span>}
          </div>

          <h2 className="lesson-title">{selectedLesson.title}</h2>
          <p className="muted">{selectedLesson.subtitle}</p>
          <p className="summary-box">{selectedLesson.summary}</p>

          <h3 className="section-label">โครงสร้างประโยค</h3>
          <div className="formula-list">
            {selectedLesson.structures.map((st, idx) => (
              <div key={idx} className="formula-pill">
                {st}
              </div>
            ))}
          </div>

          <h3 className="section-label">หลักการใช้สำคัญ</h3>
          <ul className="bullet-list">
            {selectedLesson.points.map((pt, idx) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>

          <h3 className="section-label">ตัวอย่างประโยค (กดฟังเสียงได้)</h3>
          <div className="example-list">
            {selectedLesson.examples.map((ex, idx) => (
              <div key={idx} className="example-card">
                <div className="example-top">
                  <span className="zh-lg">{ex.zh}</span>
                  <SpeakButton text={ex.zh} compact showSlow />
                </div>
                {showPinyin && <div className="pinyin">{ex.pinyin}</div>}
                <div className="th-text">{ex.th}</div>
              </div>
            ))}
          </div>

          <div className="tip-box">
            <div className="tip-head">
              <Sparkles size={16} />
              <strong>จุดออกสอบ & ข้อควรแก้จากชีท</strong>
            </div>
            <p>{selectedLesson.examTip}</p>
          </div>

          <h3 className="section-label">ทดสอบความเข้าใจท้ายบท</h3>
          <div className="stack-sm">
            {selectedLesson.miniQuiz.map((mq, qIdx) => {
              const chosen = miniAnswers[mq.id];
              const answered = chosen !== undefined;
              const ok = chosen === mq.answerIndex;
              return (
                <div key={mq.id} className="mini-quiz-box">
                  <div className="mini-q-title">
                    {qIdx + 1}. {mq.prompt}
                  </div>
                  {mq.zh && <div className="zh-md">{mq.zh}</div>}
                  <div className="options-list">
                    {mq.options.map((opt, oIdx) => {
                      let cls = 'option-btn sm';
                      if (answered) {
                        if (oIdx === mq.answerIndex) cls += ' is-correct';
                        else if (oIdx === chosen) cls += ' is-wrong';
                      }
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          className={cls}
                          disabled={answered}
                          onClick={() => setMiniAnswers((prev) => ({ ...prev, [mq.id]: oIdx }))}
                        >
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <div className={`mini-feedback ${ok ? 'ok' : 'err'}`}>
                      {ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      <span>{mq.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="action-row mt-16">
            <button
              type="button"
              className={isDone ? 'btn-outline' : 'btn-jade'}
              onClick={() => onToggleComplete(selectedLesson.id)}
            >
              <CheckCircle2 size={18} />
              <span>{isDone ? 'ยกเลิกสถานะเรียนจบ' : 'บันทึกว่าเรียนจบบทนี้ ✓'}</span>
            </button>
            {nextLesson && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (!isDone) onToggleComplete(selectedLesson.id, true);
                  setMiniAnswers({});
                  onSelectLesson(nextLesson.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span>บทถัดไป →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="filter-bar">
        {(['ALL', 'HSK 1', 'HSK 2', 'HSK 1-2'] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            className={`filter-pill ${filter === lvl ? 'active' : ''}`}
            onClick={() => setFilter(lvl)}
          >
            {lvl === 'ALL' ? `ทั้งหมด (${LESSONS.length})` : lvl}
          </button>
        ))}
      </div>

      {stages.map(([stageNum, group]) => {
        const doneCount = group.items.filter((i) => completedLessons.includes(i.id)).length;
        return (
          <section key={stageNum} className="card">
            <div className="stage-head">
              <h3>{group.title}</h3>
              <span className="pill-muted">
                {doneCount}/{group.items.length} บท
              </span>
            </div>
            <div className="lesson-list">
              {group.items.map((lesson) => {
                const done = completedLessons.includes(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className={`lesson-row ${done ? 'done' : ''}`}
                    onClick={() => onSelectLesson(lesson.id)}
                  >
                    <div className="lesson-row-icon">
                      {done ? <CheckCircle2 size={20} className="jade-text" /> : <Circle size={20} className="muted-icon" />}
                    </div>
                    <div className="lesson-row-body">
                      <div className="lesson-row-top">
                        <strong>
                          บทที่ {lesson.order}: {lesson.title}
                        </strong>
                      </div>
                      <div className="lesson-row-sub">
                        <span className="pill sm">{lesson.level}</span>
                        <span>{lesson.pdfPages}</span>
                        <span>· {lesson.estimatedMinutes} นาที</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="muted-icon" />
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
