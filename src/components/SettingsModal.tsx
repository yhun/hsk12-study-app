import { useState } from 'react';
import { Download, RotateCcw, Upload, X } from 'lucide-react';
import { UserProgress } from '../data/types';

interface SettingsModalProps {
  open: boolean;
  progress: UserProgress;
  onClose: () => void;
  onImport: (jsonText: string) => boolean;
  onReset: () => void;
}

export function SettingsModal({ open, progress, onClose, onImport, onReset }: SettingsModalProps) {
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!open) return null;

  const handleExport = () => {
    const dataStr = JSON.stringify(progress, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hsk12-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('ดาวน์โหลดไฟล์สำรองความคืบหน้าแล้วครับ');
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = onImport(importText);
    if (ok) {
      setMessage('นำเข้าความคืบหน้าสำเร็จแล้ว!');
      setImportText('');
    } else {
      setMessage('รูปแบบข้อมูล JSON ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>ตั้งค่า & สำรองข้อมูลการเรียน</h3>
          <button type="button" className="btn-icon-sm" onClick={onClose} aria-label="ปิด">
            <X size={18} />
          </button>
        </div>

        <div className="stack">
          <div className="info-box">
            <strong>แหล่งข้อมูลบทเรียน:</strong> เรียบเรียงจากเอกสาร <em>ชีทสรุปไวยากรณ์ HSK 1–2 (155 หน้า) by chineseaholic</em> ครบทั้ง 6 ช่วง, คำตรงข้าม 90 คู่ (หน้า 123–137), หมวดนำอักษร 39 หมวด (หน้า 138–147) และแก้จุดพิมพ์คลาดเคลื่อนสำคัญให้แล้ว (เช่น 后边 = ด้านหลัง, 饭 = ข้าว, 两 = liǎng, 层 = céng)
          </div>

          <div>
            <h4 className="mb-8">สำรองข้อมูลข้ามเครื่อง (คอม ↔ มือถือ)</h4>
            <p className="muted mb-8">ข้อมูลความคืบหน้าเก็บอยู่ในเบราว์เซอร์ของคุณ สามารถส่งออกเป็นไฟล์เพื่อย้ายเครื่องได้</p>
            <button type="button" className="btn-outline btn-block" onClick={handleExport}>
              <Download size={16} /> ดาวน์โหลดไฟล์สำรอง (.json)
            </button>
          </div>

          <div>
            <label className="field-label" htmlFor="import-json">
              นำเข้าข้อมูลจากไฟล์สำรอง (วาง JSON ด้านล่าง)
            </label>
            <textarea
              id="import-json"
              className="textarea"
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='วางข้อความ JSON ที่ส่งออกไว้...'
            />
            <button type="button" className="btn-jade btn-block mt-8" onClick={handleImport}>
              <Upload size={16} /> นำเข้าความคืบหน้า
            </button>
          </div>

          {message && <div className="status-msg">{message}</div>}

          <div className="danger-zone">
            {!confirmReset ? (
              <button type="button" className="btn-ghost danger" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={15} /> รีเซ็ตความคืบหน้าทั้งหมด
              </button>
            ) : (
              <div className="confirm-row">
                <span>ยืนยันลบประวัติการเรียนและ Streak ทั้งหมด?</span>
                <button
                  type="button"
                  className="btn-danger sm"
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                    setMessage('รีเซ็ตข้อมูลเรียบร้อยแล้ว');
                  }}
                >
                  ยืนยันลบ
                </button>
                <button type="button" className="btn-ghost sm" onClick={() => setConfirmReset(false)}>
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
