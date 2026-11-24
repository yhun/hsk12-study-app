import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, List, RotateCcw, Search, Sparkles } from 'lucide-react';
import { ANTONYMS } from '../data/antonyms';
import { RADICALS } from '../data/radicals';
import { SpeakButton } from './SpeakButton';

interface FlashcardsTabProps {
  showPinyin: boolean;
  masteredAntonyms: string[];
  reviewAntonyms: string[];
  masteredRadicals: string[];
  onMarkAntonym: (id: string, status: 'mastered' | 'review') => void;
  onMarkRadical: (id: string, mastered: boolean) => void;
}

export function FlashcardsTab({
  showPinyin,
  masteredAntonyms,
  reviewAntonyms,
  masteredRadicals,
  onMarkAntonym,
  onMarkRadical,
}: FlashcardsTabProps) {
  const [deck, setDeck] = useState<'antonyms' | 'radicals'>('antonyms');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [filter, setFilter] = useState<'all' | 'unmastered' | 'mastered' | 'review'>('unmastered');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [search, setSearch] = useState('');

  const filteredAntonyms = useMemo(() => {
    let items = ANTONYMS;
    if (filter === 'mastered') items = items.filter((a) => masteredAntonyms.includes(a.id));
    else if (filter === 'review') items = items.filter((a) => reviewAntonyms.includes(a.id));
    else if (filter === 'unmastered') items = items.filter((a) => !masteredAntonyms.includes(a.id));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (a) =>
          a.left.zh.includes(q) ||
          a.right.zh.includes(q) ||
          a.left.pinyin.toLowerCase().includes(q) ||
          a.right.pinyin.toLowerCase().includes(q) ||
          a.left.th.includes(q) ||
          a.right.th.includes(q)
      );
    }
    return items;
  }, [filter, masteredAntonyms, reviewAntonyms, search]);

  const filteredRadicals = useMemo(() => {
    let items = RADICALS;
    if (filter === 'mastered') items = items.filter((r) => masteredRadicals.includes(r.id));
    else if (filter === 'unmastered' || filter === 'review')
      items = items.filter((r) => !masteredRadicals.includes(r.id));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (r) =>
          r.radical.includes(q) ||
          r.nameZh.includes(q) ||
          r.meaningTh.includes(q) ||
          r.examples.some((e) => e.zh.includes(q) || e.th.includes(q))
      );
    }
    return items;
  }, [filter, masteredRadicals, search]);

  const activeList = deck === 'antonyms' ? filteredAntonyms : filteredRadicals;
  const safeIndex = activeList.length === 0 ? 0 : Math.min(index, activeList.length - 1);

  const switchDeck = (next: 'antonyms' | 'radicals') => {
    setDeck(next);
    setIndex(0);
    setFlipped(false);
    setFilter(next === 'radicals' && filter === 'review' ? 'unmastered' : filter);
  };

  return (
    <div className="stack">
      {/* Deck Switcher */}
      <div className="segmented">
        <button
          type="button"
          className={deck === 'antonyms' ? 'active' : ''}
          onClick={() => switchDeck('antonyms')}
        >
          คำตรงข้าม ({masteredAntonyms.length}/{ANTONYMS.length})
        </button>
        <button
          type="button"
          className={deck === 'radicals' ? 'active' : ''}
          onClick={() => switchDeck('radicals')}
        >
          รากศัพท์ ({masteredRadicals.length}/{RADICALS.length})
        </button>
      </div>

      {/* Controls: Filter + Card/List View */}
      <div className="toolbar-row">
        <div className="filter-bar">
          <button
            type="button"
            className={`filter-pill ${filter === 'unmastered' ? 'active' : ''}`}
            onClick={() => {
              setFilter('unmastered');
              setIndex(0);
              setFlipped(false);
            }}
          >
            ยังไม่จำ
          </button>
          {deck === 'antonyms' && (
            <button
              type="button"
              className={`filter-pill ${filter === 'review' ? 'active' : ''}`}
              onClick={() => {
                setFilter('review');
                setIndex(0);
                setFlipped(false);
              }}
            >
              ต้องทวน ({reviewAntonyms.length})
            </button>
          )}
          <button
            type="button"
            className={`filter-pill ${filter === 'mastered' ? 'active' : ''}`}
            onClick={() => {
              setFilter('mastered');
              setIndex(0);
              setFlipped(false);
            }}
          >
            จำได้แล้ว
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilter('all');
              setIndex(0);
              setFlipped(false);
            }}
          >
            ทั้งหมด
          </button>
        </div>

        <button
          type="button"
          className="btn-outline sm"
          onClick={() => setViewMode((m) => (m === 'card' ? 'list' : 'card'))}
        >
          {viewMode === 'card' ? (
            <>
              <List size={15} /> ดูทั้งหมด
            </>
          ) : (
            <>
              <Sparkles size={15} /> โหมดการ์ด
            </>
          )}
        </button>
      </div>

      {viewMode === 'list' && (
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={deck === 'antonyms' ? 'ค้นหาคำจีน พินอิน หรือคำแปล...' : 'ค้นหารากศัพท์หรือความหมาย...'}
          />
        </div>
      )}

      {activeList.length === 0 ? (
        <div className="card center-card">
          <h3>ไม่มีรายการในหมวดนี้</h3>
          <p className="muted">ลองสลับตัวกรองเป็น "ทั้งหมด" หรือยินดีด้วยที่คุณจำครบชุดนี้แล้ว!</p>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setFilter('all');
              setSearch('');
            }}
          >
            แสดงทั้งหมด
          </button>
        </div>
      ) : viewMode === 'card' ? (
        deck === 'antonyms' ? (
          (() => {
            const pair = filteredAntonyms[safeIndex];
            const isMastered = masteredAntonyms.includes(pair.id);
            return (
              <div className="stack">
                <div className="runner-header">
                  <span className="pill-muted">
                    ใบที่ {safeIndex + 1} / {filteredAntonyms.length} · ชีทหน้า {pair.page}
                  </span>
                  {isMastered && <span className="badge badge-jade">จำได้แล้ว ✓</span>}
                </div>

                <div
                  className={`flashcard ${flipped ? 'is-flipped' : ''}`}
                  onClick={() => setFlipped((f) => !f)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="antonym-pair">
                    <div className="antonym-side">
                      <div className="zh-hero">{pair.left.zh}</div>
                      {showPinyin && <div className="pinyin">{pair.left.pinyin}</div>}
                      <SpeakButton text={pair.left.zh} compact />
                    </div>
                    <div className="vs-divider">↔</div>
                    <div className="antonym-side">
                      <div className="zh-hero">{pair.right.zh}</div>
                      {showPinyin && <div className="pinyin">{pair.right.pinyin}</div>}
                      <SpeakButton text={pair.right.zh} compact />
                    </div>
                  </div>

                  {flipped ? (
                    <div className="flashcard-answer">
                      <div>
                        <strong>{pair.left.zh}</strong> ({pair.left.pinyin}) = {pair.left.th}
                      </div>
                      <div>
                        <strong>{pair.right.zh}</strong> ({pair.right.pinyin}) = {pair.right.th}
                      </div>
                    </div>
                  ) : (
                    <div className="tap-hint">แตะที่การ์ดเพื่อดูความหมายภาษาไทย</div>
                  )}
                </div>

                <div className="action-row">
                  <button
                    type="button"
                    className="btn-icon-nav"
                    onClick={() => {
                      setFlipped(false);
                      setIndex((i) => (i - 1 + filteredAntonyms.length) % filteredAntonyms.length);
                    }}
                    aria-label="ก่อนหน้า"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      const removesCurrent = filter === 'mastered';
                      onMarkAntonym(pair.id, 'review');
                      setFlipped(false);
                      if (removesCurrent) {
                        setIndex((i) => (i >= filteredAntonyms.length - 1 ? 0 : i));
                      } else {
                        setIndex((i) => (i + 1) % filteredAntonyms.length);
                      }
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>ต้องทวน</span>
                  </button>
                  <button
                    type="button"
                    className="btn-jade"
                    onClick={() => {
                      const removesCurrent = filter === 'unmastered' || filter === 'review';
                      onMarkAntonym(pair.id, 'mastered');
                      setFlipped(false);
                      if (removesCurrent) {
                        setIndex((i) => (i >= filteredAntonyms.length - 1 ? 0 : i));
                      } else {
                        setIndex((i) => (i + 1) % filteredAntonyms.length);
                      }
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>จำได้แล้ว ✓</span>
                  </button>
                  <button
                    type="button"
                    className="btn-icon-nav"
                    onClick={() => {
                      setFlipped(false);
                      setIndex((i) => (i + 1) % filteredAntonyms.length);
                    }}
                    aria-label="ถัดไป"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          (() => {
            const rad = filteredRadicals[safeIndex];
            const isMastered = masteredRadicals.includes(rad.id);
            return (
              <div className="stack">
                <div className="runner-header">
                  <span className="pill-muted">
                    หมวดที่ {safeIndex + 1} / {filteredRadicals.length} · ชีทหน้า {rad.page}
                  </span>
                  {isMastered && <span className="badge badge-jade">จำได้แล้ว ✓</span>}
                </div>

                <div
                  className={`flashcard ${flipped ? 'is-flipped' : ''}`}
                  onClick={() => setFlipped((f) => !f)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="radical-hero">{rad.radical}</div>
                  <div className="zh-md">{rad.nameZh}</div>
                  {showPinyin && <div className="pinyin">[{rad.pinyin}]</div>}

                  {flipped ? (
                    <div className="flashcard-answer left-align">
                      <div className="rad-meaning">
                        <strong>ความหมายหมวดนำ:</strong> {rad.meaningTh}
                      </div>
                      <div className="rad-examples">
                        {rad.examples.map((ex, i) => (
                          <div key={i} className="rad-ex-row">
                            <span className="zh-md">{ex.zh}</span>
                            {showPinyin && <span className="pinyin">{ex.pinyin}</span>}
                            <span>— {ex.th}</span>
                            <SpeakButton text={ex.zh} compact />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="tap-hint">แตะการ์ดเพื่อดูความหมายและตัวอย่างคำ</div>
                  )}
                </div>

                <div className="action-row">
                  <button
                    type="button"
                    className="btn-icon-nav"
                    onClick={() => {
                      setFlipped(false);
                      setIndex((i) => (i - 1 + filteredRadicals.length) % filteredRadicals.length);
                    }}
                    aria-label="ก่อนหน้า"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      const removesCurrent = filter === 'mastered';
                      onMarkRadical(rad.id, false);
                      setFlipped(false);
                      if (removesCurrent) {
                        setIndex((i) => (i >= filteredRadicals.length - 1 ? 0 : i));
                      } else {
                        setIndex((i) => (i + 1) % filteredRadicals.length);
                      }
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>ทวนอีกที</span>
                  </button>
                  <button
                    type="button"
                    className="btn-jade"
                    onClick={() => {
                      const removesCurrent = filter === 'unmastered' || filter === 'review';
                      onMarkRadical(rad.id, true);
                      setFlipped(false);
                      if (removesCurrent) {
                        setIndex((i) => (i >= filteredRadicals.length - 1 ? 0 : i));
                      } else {
                        setIndex((i) => (i + 1) % filteredRadicals.length);
                      }
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>จำได้แล้ว ✓</span>
                  </button>
                  <button
                    type="button"
                    className="btn-icon-nav"
                    onClick={() => {
                      setFlipped(false);
                      setIndex((i) => (i + 1) % filteredRadicals.length);
                    }}
                    aria-label="ถัดไป"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            );
          })()
        )
      ) : (
        <div className="card">
          {deck === 'antonyms' ? (
            <div className="table-list">
              {filteredAntonyms.map((a) => {
                const done = masteredAntonyms.includes(a.id);
                return (
                  <div key={a.id} className="table-row">
                    <div className="table-pair">
                      <div>
                        <strong className="zh-md">{a.left.zh}</strong>{' '}
                        {showPinyin && <span className="pinyin">{a.left.pinyin}</span>}{' '}
                        <span className="muted">({a.left.th})</span>
                      </div>
                      <span className="vs-inline">↔</span>
                      <div>
                        <strong className="zh-md">{a.right.zh}</strong>{' '}
                        {showPinyin && <span className="pinyin">{a.right.pinyin}</span>}{' '}
                        <span className="muted">({a.right.th})</span>
                      </div>
                    </div>
                    <div className="table-actions">
                      <SpeakButton text={`${a.left.zh} ${a.right.zh}`} compact />
                      <button
                        type="button"
                        className={`mini-check-btn ${done ? 'done' : ''}`}
                        onClick={() => onMarkAntonym(a.id, done ? 'review' : 'mastered')}
                        title={done ? 'จำได้แล้ว' : 'ทำเครื่องหมายว่าจำได้แล้ว'}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="table-list">
              {filteredRadicals.map((r) => {
                const done = masteredRadicals.includes(r.id);
                return (
                  <div key={r.id} className="table-row">
                    <div className="rad-list-item">
                      <span className="rad-glyph">{r.radical}</span>
                      <div>
                        <div>
                          <strong>{r.nameZh}</strong>{' '}
                          {showPinyin && <span className="pinyin">[{r.pinyin}]</span>}
                        </div>
                        <div className="muted">{r.meaningTh}</div>
                        <div className="rad-inline-ex">
                          {r.examples.map((ex, i) => (
                            <span key={i} className="pill-muted">
                              {ex.zh} ({ex.th})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`mini-check-btn ${done ? 'done' : ''}`}
                      onClick={() => onMarkRadical(r.id, !done)}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
