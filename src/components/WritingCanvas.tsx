import { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Eye, EyeOff, Undo2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
}

interface WritingCanvasProps {
  char: string;
}

export function WritingCanvas({ char }: WritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const [showGuide, setShowGuide] = useState(true);
  const [inkColor, setInkColor] = useState<'#1C1917' | '#C83E37'>('#1C1917');

  const size = 260;

  const drawAll = useCallback(
    (currentStrokes: Stroke[], active: Stroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      // Paper background
      ctx.fillStyle = '#FFFDF9';
      ctx.fillRect(0, 0, size, size);

      // 田字格 grid lines
      ctx.strokeStyle = 'rgba(200, 62, 55, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      // Cross lines
      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 2, size);
      ctx.moveTo(0, size / 2);
      ctx.lineTo(size, size / 2);
      ctx.stroke();

      // Diagonal guides
      ctx.strokeStyle = 'rgba(200, 62, 55, 0.14)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size, size);
      ctx.moveTo(size, 0);
      ctx.lineTo(0, size);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(200, 62, 55, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, size - 2, size - 2);

      // Faint trace guide character
      if (showGuide) {
        ctx.fillStyle = 'rgba(28, 25, 23, 0.12)';
        ctx.font = '600 185px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, size / 2, size / 2 + 6);
      }

      // Render strokes
      const renderStroke = (s: Stroke) => {
        if (s.points.length === 0) return;
        ctx.strokeStyle = s.color;
        ctx.fillStyle = s.color;
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (s.points.length === 1) {
          ctx.beginPath();
          ctx.arc(s.points[0].x, s.points[0].y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i += 1) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
      };

      for (const s of currentStrokes) {
        renderStroke(s);
      }
      if (active) {
        renderStroke(active);
      }

      ctx.restore();
    },
    [char, showGuide]
  );

  // Clear strokes when character changes
  useEffect(() => {
    setStrokes([]);
    activeStrokeRef.current = null;
    drawingRef.current = false;
  }, [char]);

  useEffect(() => {
    drawAll(strokes, activeStrokeRef.current);
  }, [strokes, drawAll]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * size,
      y: ((e.clientY - rect.top) / rect.height) * size,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const pt = getPoint(e);
    activeStrokeRef.current = { points: [pt], color: inkColor };
    drawAll(strokes, activeStrokeRef.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !activeStrokeRef.current) return;
    const pt = getPoint(e);
    activeStrokeRef.current.points.push(pt);
    drawAll(strokes, activeStrokeRef.current);
  };

  const finishStroke = () => {
    if (!drawingRef.current || !activeStrokeRef.current) return;
    const completed = activeStrokeRef.current;
    activeStrokeRef.current = null;
    drawingRef.current = false;
    setStrokes((prev) => [...prev, completed]);
  };

  return (
    <div className="writing-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="writing-canvas"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />

      <div className="canvas-controls">
        <button
          type="button"
          className={`btn-outline sm ${showGuide ? 'is-active-jade' : ''}`}
          onClick={() => setShowGuide((g) => !g)}
        >
          {showGuide ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>{showGuide ? 'ซ่อนเส้นประ' : 'แสดงเส้นประ'}</span>
        </button>

        <button
          type="button"
          className="btn-outline sm"
          onClick={() => setInkColor((c) => (c === '#1C1917' ? '#C83E37' : '#1C1917'))}
        >
          <span className="ink-dot" style={{ background: inkColor }} />
          <span>{inkColor === '#1C1917' ? 'หมึกดำ' : 'หมึกแดง'}</span>
        </button>

        <button
          type="button"
          className="btn-outline sm"
          disabled={strokes.length === 0}
          onClick={() => setStrokes((prev) => prev.slice(0, -1))}
        >
          <Undo2 size={14} />
          <span>ย้อนเส้น</span>
        </button>

        <button
          type="button"
          className="btn-outline sm"
          disabled={strokes.length === 0}
          onClick={() => setStrokes([])}
        >
          <Eraser size={14} />
          <span>ล้าง</span>
        </button>
      </div>
    </div>
  );
}
