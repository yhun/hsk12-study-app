import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Headphones,
  Mic,
  MicOff,
  PenTool,
  Puzzle,
  RotateCcw,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  LISTENING_ITEMS,
  READING_PASSAGES,
  SENTENCE_BUILDERS,
  SPEAKING_ITEMS,
  WRITING_CHARS,
} from '../data/skills';
import { SkillMode, UserProgress } from '../data/types';
import { speakChinese } from '../utils/speech';
import { SpeakButton } from './SpeakButton';
import { WritingCanvas } from './WritingCanvas';

interface BrowserSpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function normalizeHanzi(input: string): string {
  return input.replace(/[^\u4e00-\u9fff0-9]/g, '');
}

function deterministicShuffle(tokens: string[], seedStr: string): { token: string; key: string }[] {
  const indexed = tokens.map((token, idx) => ({ token, key: `${seedStr}-${idx}` }));
  if (indexed.length <= 1) return indexed;
  // Simple deterministic rotation + swap so order differs from solution
  const copy = [...indexed];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = (seedStr.charCodeAt(i % seedStr.length) + i * 3) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  if (copy.map((c) => c.token).join('') === tokens.join('')) {
    const first = copy.shift();
    if (first) copy.push(first);
  }
  return copy;
}

interface SkillsTabProps {
  progress: UserProgress;
  initialSkill: SkillMode;
  skillSignal: number;
  onMarkSkill: (skill: 'listening' | 'speaking' | 'reading' | 'writing' | 'sentence', id: string) => void;
}

export function SkillsTab({ progress, initialSkill, skillSignal, onMarkSkill }: SkillsTabProps) {
  const [skill, setSkill] = useState<SkillMode>(initialSkill);
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'HSK 1' | 'HSK 2'>('ALL');

  // Listening state
  const [lisIdx, setLisIdx] = useState(0);
  const [lisChoice, setLisChoice] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  // Speaking state
  const [spkIdx, setSpkIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [speechErr, setSpeechErr] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  // Reading state
  const [readIdx, setReadIdx] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [readAnswers, setReadAnswers] = useState<Record<string, number>>({});

  // Writing state
  const [writeMode, setWriteMode] = useState<'char' | 'sentence'>('char');
  const [charIdx, setCharIdx] = useState(0);
  const [sbIdx, setSbIdx] = useState(0);
  const [pickedKeys, setPickedKeys] = useState<string[]>([]);
  const [sbChecked, setSbChecked] = useState<'idle' | 'ok' | 'err'>('idle');

  useEffect(() => {
    setSkill(initialSkill);
  }, [initialSkill, skillSignal]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const filteredListening = useMemo(
    () => (levelFilter === 'ALL' ? LISTENING_ITEMS : LISTENING_ITEMS.filter((i) => i.level === levelFilter)),
    [levelFilter]
  );
  const filteredSpeaking = useMemo(
    () => (levelFilter === 'ALL' ? SPEAKING_ITEMS : SPEAKING_ITEMS.filter((i) => i.level === levelFilter)),
    [levelFilter]
  );
  const filteredReading = useMemo(
    () => (levelFilter === 'ALL' ? READING_PASSAGES : READING_PASSAGES.filter((i) => i.level === levelFilter)),
    [levelFilter]
  );
  const filteredSentences = useMemo(
    () => (levelFilter === 'ALL' ? SENTENCE_BUILDERS : SENTENCE_BUILDERS.filter((i) => i.level === levelFilter)),
    [levelFilter]
  );

  const safeLisIdx = Math.min(lisIdx, Math.max(0, filteredListening.length - 1));
  const safeSpkIdx = Math.min(spkIdx, Math.max(0, filteredSpeaking.length - 1));
  const safeReadIdx = Math.min(readIdx, Math.max(0, filteredReading.length - 1));
  const safeCharIdx = Math.min(charIdx, WRITING_CHARS.length - 1);
  const safeSbIdx = Math.min(sbIdx, Math.max(0, filteredSentences.length - 1));

  const speechRecCtor = getSpeechRecognitionCtor();

  const startSpeakingRecognition = (targetZh: string, itemId: string) => {
    if (!speechRecCtor) return;
    setSpeechErr(null);
    setRecognizedText(null);
    try {
      recognitionRef.current?.stop();
      const rec = new speechRecCtor();
      rec.lang = 'zh-CN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const spoken = event.results?.[0]?.[0]?.transcript ?? '';
        setRecognizedText(spoken);
        const normTarget = normalizeHanzi(targetZh);
        const normSpoken = normalizeHanzi(spoken);
        if (normTarget.length > 0) {
          let matches = 0;
          const remaining = normSpoken.split('');
          for (const ch of normTarget) {
            const pos = remaining.indexOf(ch);
            if (pos !== -1) {
              matches += 1;
              remaining.splice(pos, 1);
            }
          }
          const score = Math.round((matches / normTarget.length) * 100);
          if (score >= 70) {
            onMarkSkill('speaking', itemId);
          }
        }
      };
      rec.onerror = (ev) => {
        if (ev.error === 'not-allowed') {
          setSpeechErr('ยังไม่ได้อนุญาตใช้ไมโครโฟน กรุณากดอนุญาตที่เบราว์เซอร์หรือใช้ปุ่มบันทึกด้านล่างแทน');
        } else if (ev.error === 'no-speech') {
          setSpeechErr('ไม่ได้ยินเสียงพูด ลองกดแล้วพูดใกล้ไมโครโฟนอีกครั้งนะครับ');
        } else {
          setSpeechErr(`ไม่สามารถรับเสียงได้ (${ev.error}) สามารถกดฟังเสียงเทียบและบันทึกฝึกเองได้ครับ`);
        }
        setIsRecording(false);
      };
      rec.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current = rec;
      setIsRecording(true);
      rec.start();
    } catch {
      setIsRecording(false);
      setSpeechErr('เบราว์เซอร์นี้ไม่รองรับการตรวจเสียงพูด สามารถฟังเทียบและกดฝึกแล้วได้ครับ');
    }
  };

  const stopSpeakingRecognition = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="stack">
      {/* 4-Skill Selector */}
      <div className="skill-tabs" role="tablist" aria-label="ฝึก 4 ทักษะ">
        <button
          type="button"
          className={`skill-tab ${skill === 'listening' ? 'active' : ''}`}
          onClick={() => setSkill('listening')}
        >
          <Headphones size={16} />
          <span>ฟัง ({progress.completedListening.length}/{LISTENING_ITEMS.length})</span>
        </button>
        <button
          type="button"
          className={`skill-tab ${skill === 'speaking' ? 'active' : ''}`}
          onClick={() => setSkill('speaking')}
        >
          <Mic size={16} />
          <span>พูด ({progress.completedSpeaking.length}/{SPEAKING_ITEMS.length})</span>
        </button>
        <button
          type="button"
          className={`skill-tab ${skill === 'reading' ? 'active' : ''}`}
          onClick={() => setSkill('reading')}
        >
          <BookOpen size={16} />
          <span>อ่าน ({progress.completedReading.length}/{READING_PASSAGES.length})</span>
        </button>
        <button
          type="button"
          className={`skill-tab ${skill === 'writing' ? 'active' : ''}`}
          onClick={() => setSkill('writing')}
        >
          <PenTool size={16} />
          <span>
            เขียน ({progress.practicedWriting.length + progress.completedSentences.length}/
            {WRITING_CHARS.length + SENTENCE_BUILDERS.length})
          </span>
        </button>
      </div>

      {/* Level Filter (hidden on character tracing sub-mode since characters cover HSK1-2) */}
      {!(skill === 'writing' && writeMode === 'char') && (
        <div className="filter-bar">
          {(['ALL', 'HSK 1', 'HSK 2'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={`filter-pill ${levelFilter === lvl ? 'active' : ''}`}
              onClick={() => {
                setLevelFilter(lvl);
                setLisIdx(0);
                setLisChoice(null);
                setShowTranscript(false);
                setSpkIdx(0);
                setRecognizedText(null);
                setReadIdx(0);
                setReadAnswers({});
                setSbIdx(0);
                setPickedKeys([]);
                setSbChecked('idle');
              }}
            >
              {lvl === 'ALL' ? 'ทุกระดับ (HSK 1–2)' : lvl}
            </button>
          ))}
        </div>
      )}

      {/* ==================== 1. LISTENING (ฟัง) ==================== */}
      {skill === 'listening' && filteredListening[safeLisIdx] && (() => {
        const item = filteredListening[safeLisIdx];
        const answered = lisChoice !== null;
        const isCorrect = lisChoice === item.answerIndex;
        const done = progress.completedListening.includes(item.id);

        return (
          <div className="stack">
            <div className="runner-header">
              <span className="pill-muted">
                ข้อฟังที่ {safeLisIdx + 1} / {filteredListening.length} · {item.pdfPage}
              </span>
              {done && <span className="badge badge-jade">ผ่านข้อนี้แล้ว ✓</span>}
            </div>

            <div className="card">
              <div className="card-meta">
                <span className="pill">{item.level}</span>
                <span className="pill-muted">{item.topic}</span>
              </div>

              <div className="listen-player">
                <button
                  type="button"
                  className="btn-primary listen-play-btn"
                  onClick={() => speakChinese(item.zh, 0.92)}
                >
                  <Volume2 size={20} />
                  <span>กดฟังเสียงภาษาจีน</span>
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => speakChinese(item.zh, 0.62)}
                >
                  <span>ฟังช้า (0.6x)</span>
                </button>
              </div>

              <div className="transcript-toggle-row">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowTranscript((s) => !s)}
                >
                  {showTranscript ? <EyeOff size={15} /> : <Eye size={15} />}
                  <span>{showTranscript || answered ? 'ซ่อนบทพูด' : 'ดูบทพูดภาษาจีน (ตัวช่วย)'}</span>
                </button>
              </div>

              {(showTranscript || answered) && (
                <div className="quiz-zh-box">
                  <div className="zh-lg">{item.zh}</div>
                  {progress.showPinyin && <div className="pinyin">{item.pinyin}</div>}
                  {answered && <div className="th-text">{item.th}</div>}
                </div>
              )}

              <h3 className="quiz-prompt">{item.question}</h3>

              <div className="options-list">
                {item.options.map((opt, idx) => {
                  let cls = 'option-btn';
                  if (answered) {
                    if (idx === item.answerIndex) cls += ' is-correct';
                    else if (idx === lisChoice) cls += ' is-wrong';
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={cls}
                      disabled={answered}
                      onClick={() => {
                        setLisChoice(idx);
                        if (idx === item.answerIndex) {
                          onMarkSkill('listening', item.id);
                        }
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
                    <span>{isCorrect ? 'ฟังแม่นมาก ถูกต้องครับ!' : 'ยังไม่ตรง ลองกดฟังซ้ำอีกรอบครับ'}</span>
                  </div>
                  <p>{item.explanation}</p>
                </div>
              )}

              <div className="action-row mt-16">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    setLisChoice(null);
                    setShowTranscript(false);
                    setLisIdx((i) => (i - 1 + filteredListening.length) % filteredListening.length);
                  }}
                >
                  <ChevronLeft size={16} /> ข้อก่อนหน้า
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setLisChoice(null);
                    setShowTranscript(false);
                    setLisIdx((i) => (i + 1) % filteredListening.length);
                  }}
                >
                  ข้อถัดไป <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 2. SPEAKING (พูด) ==================== */}
      {skill === 'speaking' && filteredSpeaking[safeSpkIdx] && (() => {
        const item = filteredSpeaking[safeSpkIdx];
        const done = progress.completedSpeaking.includes(item.id);
        const targetChars = item.zh.split('');
        const normSpoken = recognizedText ? normalizeHanzi(recognizedText) : '';
        const normTarget = normalizeHanzi(item.zh);

        let matchCount = 0;
        const pool = normSpoken.split('');
        if (recognizedText) {
          for (const ch of normTarget) {
            const p = pool.indexOf(ch);
            if (p !== -1) {
              matchCount += 1;
              pool.splice(p, 1);
            }
          }
        }
        const accuracy = normTarget.length > 0 && recognizedText ? Math.round((matchCount / normTarget.length) * 100) : null;

        return (
          <div className="stack">
            <div className="runner-header">
              <span className="pill-muted">
                ประโยคฝึกพูด {safeSpkIdx + 1} / {filteredSpeaking.length} · {item.pdfPage}
              </span>
              {done && <span className="badge badge-jade">ฝึกพูดแล้ว ✓</span>}
            </div>

            <div className="card">
              <div className="card-meta">
                <span className="pill">{item.level}</span>
              </div>

              <div className="speaking-target-box">
                <div className="zh-speaking">
                  {recognizedText ? (
                    targetChars.map((ch, idx) => {
                      const isPunct = !/[\u4e00-\u9fff0-9]/.test(ch);
                      const matched = isPunct || normSpoken.includes(ch);
                      return (
                        <span key={idx} className={isPunct ? '' : matched ? 'char-ok' : 'char-miss'}>
                          {ch}
                        </span>
                      );
                    })
                  ) : (
                    item.zh
                  )}
                </div>
                {progress.showPinyin && <div className="pinyin mt-8">{item.pinyin}</div>}
                <div className="th-text mt-8">{item.th}</div>
              </div>

              <div className="tip-box">
                <strong>เคล็ดลับออกเสียง:</strong> {item.focusTip}
              </div>

              <div className="speaking-actions">
                <SpeakButton text={item.zh} showSlow />

                {speechRecCtor ? (
                  <button
                    type="button"
                    className={`btn-mic ${isRecording ? 'recording' : ''}`}
                    onClick={() =>
                      isRecording ? stopSpeakingRecognition() : startSpeakingRecognition(item.zh, item.id)
                    }
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    <span>{isRecording ? 'กำลังฟัง... แตะเพื่อหยุด' : 'กดพูดตาม (ตรวจเสียง AI)'}</span>
                  </button>
                ) : (
                  <div className="muted">
                    เบราว์เซอร์นี้ยังไม่รองรับไมโครโฟนตรวจเสียงภาษาจีน — กดฟังเสียงต้นแบบแล้วพูดออกเสียงตามได้เลยครับ
                  </div>
                )}
              </div>

              {speechErr && <div className="feedback-box err">{speechErr}</div>}

              {recognizedText !== null && accuracy !== null && (
                <div className={`feedback-box ${accuracy >= 70 ? 'ok' : 'err'}`}>
                  <div className="feedback-title">
                    {accuracy >= 70 ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    <span>ความแม่นยำ: {accuracy}%</span>
                  </div>
                  <div>เสียงที่ได้ยิน: 「{recognizedText || '—'}」</div>
                </div>
              )}

              <div className="action-row mt-16">
                <button
                  type="button"
                  className="btn-icon-nav"
                  onClick={() => {
                    stopSpeakingRecognition();
                    setRecognizedText(null);
                    setSpeechErr(null);
                    setSpkIdx((i) => (i - 1 + filteredSpeaking.length) % filteredSpeaking.length);
                  }}
                  aria-label="ประโยคก่อนหน้า"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className={done ? 'btn-outline' : 'btn-jade'}
                  onClick={() => {
                    onMarkSkill('speaking', item.id);
                    setRecognizedText(null);
                    setSpeechErr(null);
                    setSpkIdx((i) => (i + 1) % filteredSpeaking.length);
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{done ? 'ฝึกซ้ำแล้ว · ถัดไป →' : 'ฝึกออกเสียงแล้ว ✓'}</span>
                </button>
                <button
                  type="button"
                  className="btn-icon-nav"
                  onClick={() => {
                    stopSpeakingRecognition();
                    setRecognizedText(null);
                    setSpeechErr(null);
                    setSpkIdx((i) => (i + 1) % filteredSpeaking.length);
                  }}
                  aria-label="ประโยคถัดไป"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 3. READING (อ่าน) ==================== */}
      {skill === 'reading' && filteredReading[safeReadIdx] && (() => {
        const passage = filteredReading[safeReadIdx];
        const done = progress.completedReading.includes(passage.id);
        const fullAudio = passage.lines.map((l) => l.zh).join(' ');

        return (
          <div className="stack">
            <div className="runner-header">
              <span className="pill-muted">
                บทอ่านที่ {safeReadIdx + 1} / {filteredReading.length} · {passage.pdfPages}
              </span>
              {done && <span className="badge badge-jade">อ่านจบแล้ว ✓</span>}
            </div>

            <div className="card">
              <div className="card-meta">
                <span className="pill">{passage.level}</span>
                <SpeakButton text={fullAudio} showSlow />
              </div>

              <h3 className="lesson-title">{passage.title}</h3>

              <div className="reading-lines">
                {passage.lines.map((line, i) => (
                  <div key={i} className="reading-line">
                    <div className="reading-line-top">
                      <div>
                        {line.speaker && <span className="speaker-tag">{line.speaker}:</span>}
                        <span className="zh-lg">{line.zh}</span>
                      </div>
                      <SpeakButton text={line.zh} compact />
                    </div>
                    {progress.showPinyin && <div className="pinyin">{line.pinyin}</div>}
                    {showTranslation && <div className="th-text">{line.th}</div>}
                  </div>
                ))}
              </div>

              <div className="reading-tools">
                <button
                  type="button"
                  className="btn-outline sm"
                  onClick={() => setShowTranslation((t) => !t)}
                >
                  {showTranslation ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showTranslation ? 'ซ่อนคำแปลไทย' : 'ดูคำแปลไทย'}</span>
                </button>
              </div>

              <div className="vocab-chips">
                <span className="muted">คำศัพท์ช่วยจำ:</span>
                {passage.vocabHints.map((v, i) => (
                  <span key={i} className="pill-muted">
                    <strong>{v.zh}</strong> {progress.showPinyin ? `(${v.pinyin})` : ''} = {v.th}
                  </span>
                ))}
              </div>

              <h4 className="section-label">คำถามจับใจความ</h4>
              <div className="stack-sm">
                {passage.questions.map((q, qIdx) => {
                  const chosen = readAnswers[q.id];
                  const answered = chosen !== undefined;
                  const ok = chosen === q.answerIndex;
                  return (
                    <div key={q.id} className="mini-quiz-box">
                      <div className="mini-q-title">
                        {qIdx + 1}. {q.prompt}
                      </div>
                      <div className="options-list">
                        {q.options.map((opt, oIdx) => {
                          let cls = 'option-btn sm';
                          if (answered) {
                            if (oIdx === q.answerIndex) cls += ' is-correct';
                            else if (oIdx === chosen) cls += ' is-wrong';
                          }
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              className={cls}
                              disabled={answered}
                              onClick={() => {
                                const updated = { ...readAnswers, [q.id]: oIdx };
                                setReadAnswers(updated);
                                if (passage.questions.every((pq) => updated[pq.id] !== undefined)) {
                                  onMarkSkill('reading', passage.id);
                                }
                              }}
                            >
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                      {answered && (
                        <div className={`mini-feedback ${ok ? 'ok' : 'err'}`}>
                          {ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="action-row mt-16">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    setShowTranslation(false);
                    setReadIdx((i) => (i - 1 + filteredReading.length) % filteredReading.length);
                  }}
                >
                  <ChevronLeft size={16} /> บทก่อนหน้า
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    onMarkSkill('reading', passage.id);
                    setShowTranslation(false);
                    setReadIdx((i) => (i + 1) % filteredReading.length);
                  }}
                >
                  บทอ่านถัดไป <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 4. WRITING (เขียน) ==================== */}
      {skill === 'writing' && (
        <div className="stack">
          <div className="segmented">
            <button
              type="button"
              className={writeMode === 'char' ? 'active' : ''}
              onClick={() => setWriteMode('char')}
            >
              <PenTool size={14} /> คัดอักษรจีน ({progress.practicedWriting.length}/{WRITING_CHARS.length})
            </button>
            <button
              type="button"
              className={writeMode === 'sentence' ? 'active' : ''}
              onClick={() => setWriteMode('sentence')}
            >
              <Puzzle size={14} /> เรียงคำแต่งประโยค ({progress.completedSentences.length}/{SENTENCE_BUILDERS.length})
            </button>
          </div>

          {writeMode === 'char' ? (() => {
            const wc = WRITING_CHARS[safeCharIdx];
            const done = progress.practicedWriting.includes(wc.id);
            return (
              <div className="stack">
                <div className="runner-header">
                  <span className="pill-muted">
                    ตัวที่ {safeCharIdx + 1} / {WRITING_CHARS.length} · {wc.pdfPage}
                  </span>
                  {done && <span className="badge badge-jade">ฝึกเขียนแล้ว ✓</span>}
                </div>

                <div className="card">
                  <div className="char-header">
                    <div className="char-main-info">
                      <div className="zh-hero">{wc.char}</div>
                      <div>
                        {progress.showPinyin && <div className="pinyin">{wc.pinyin}</div>}
                        <div className="th-text">
                          <strong>{wc.th}</strong> · รากศัพท์: {wc.radical}
                        </div>
                        <div className="muted">
                          คำประสม: {wc.exampleWord.zh} ({wc.exampleWord.pinyin}) = {wc.exampleWord.th}
                        </div>
                      </div>
                    </div>
                    <SpeakButton text={wc.char} compact />
                  </div>

                  <div className="tip-box">
                    <strong>ลำดับขีดที่ถูกต้อง:</strong> {wc.strokeTip}
                  </div>

                  <WritingCanvas char={wc.char} />

                  <div className="action-row mt-16">
                    <button
                      type="button"
                      className="btn-icon-nav"
                      onClick={() => setCharIdx((i) => (i - 1 + WRITING_CHARS.length) % WRITING_CHARS.length)}
                      aria-label="ตัวก่อนหน้า"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      className="btn-jade"
                      onClick={() => {
                        onMarkSkill('writing', wc.id);
                        setCharIdx((i) => (i + 1) % WRITING_CHARS.length);
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>ฝึกเขียนแล้ว · ตัวถัดไป →</span>
                    </button>
                    <button
                      type="button"
                      className="btn-icon-nav"
                      onClick={() => setCharIdx((i) => (i + 1) % WRITING_CHARS.length)}
                      aria-label="ตัวถัดไป"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })() : filteredSentences[safeSbIdx] ? (() => {
            const sb = filteredSentences[safeSbIdx];
            const done = progress.completedSentences.includes(sb.id);
            const shuffled = deterministicShuffle(sb.tokens, sb.id);
            const pickedTokens = pickedKeys
              .map((k) => shuffled.find((x) => x.key === k))
              .filter((x): x is { token: string; key: string } => Boolean(x));
            const availableTokens = shuffled.filter((x) => !pickedKeys.includes(x.key));
            const assembled = pickedTokens.map((x) => x.token).join('');
            const expected = sb.tokens.join('');

            return (
              <div className="stack">
                <div className="runner-header">
                  <span className="pill-muted">
                    ข้อแต่งประโยค {safeSbIdx + 1} / {filteredSentences.length} · {sb.pdfPage}
                  </span>
                  {done && <span className="badge badge-jade">แต่งถูกแล้ว ✓</span>}
                </div>

                <div className="card">
                  <div className="card-meta">
                    <span className="pill">{sb.level}</span>
                  </div>
                  <h3 className="quiz-prompt">เรียงคำเป็นประโยค: “{sb.th}”</h3>

                  {/* Answer Zone */}
                  <div className="sentence-dropzone">
                    {pickedTokens.length === 0 ? (
                      <span className="muted">แตะการ์ดคำด้านล่างเพื่อเรียงประโยค...</span>
                    ) : (
                      pickedTokens.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className="token-chip picked"
                          onClick={() => {
                            setSbChecked('idle');
                            setPickedKeys((prev) => prev.filter((k) => k !== item.key));
                          }}
                        >
                          {item.token}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Available Tiles */}
                  <div className="token-pool">
                    {availableTokens.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="token-chip"
                        onClick={() => {
                          setSbChecked('idle');
                          setPickedKeys((prev) => [...prev, item.key]);
                        }}
                      >
                        {item.token}
                      </button>
                    ))}
                  </div>

                  <div className="action-row mt-16">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setPickedKeys([]);
                        setSbChecked('idle');
                      }}
                    >
                      <RotateCcw size={16} /> เรียงใหม่
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={availableTokens.length > 0}
                      onClick={() => {
                        if (assembled === expected) {
                          setSbChecked('ok');
                          onMarkSkill('sentence', sb.id);
                        } else {
                          setSbChecked('err');
                        }
                      }}
                    >
                      ตรวจคำตอบ
                    </button>
                  </div>

                  {sbChecked !== 'idle' && (
                    <div className={`feedback-box ${sbChecked === 'ok' ? 'ok' : 'err'}`}>
                      <div className="feedback-title">
                        {sbChecked === 'ok' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        <span>{sbChecked === 'ok' ? 'เรียงประโยคถูกต้อง!' : 'ลำดับคำยังไม่ตรง ลองสลับดูอีกครั้งครับ'}</span>
                      </div>
                      {sbChecked === 'ok' && (
                        <>
                          <div className="example-top">
                            <span className="zh-md">{expected}</span>
                            <SpeakButton text={expected} compact />
                          </div>
                          {progress.showPinyin && <div className="pinyin">{sb.pinyin}</div>}
                        </>
                      )}
                      <p>{sb.explanation}</p>
                    </div>
                  )}

                  <div className="action-row mt-16">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setPickedKeys([]);
                        setSbChecked('idle');
                        setSbIdx((i) => (i - 1 + filteredSentences.length) % filteredSentences.length);
                      }}
                    >
                      <ChevronLeft size={16} /> ข้อก่อนหน้า
                    </button>
                    <button
                      type="button"
                      className="btn-jade"
                      onClick={() => {
                        setPickedKeys([]);
                        setSbChecked('idle');
                        setSbIdx((i) => (i + 1) % filteredSentences.length);
                      }}
                    >
                      ข้อถัดไป <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })() : null}
        </div>
      )}
    </div>
  );
}
