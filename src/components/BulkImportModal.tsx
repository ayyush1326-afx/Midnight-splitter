import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { isValidMultiChainAddress } from '../services/midnightContract';
import { sounds } from '../services/soundEffects';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (addresses: Array<{ address: string; nickname?: string; percentage?: number }>) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [text, setText] = useState('');
  const [parsedItems, setParsedItems] = useState<Array<{ address: string; nickname?: string; percentage?: number; valid: boolean }>>([]);

  if (!isOpen) return null;

  const handleParse = (input: string) => {
    setText(input);
    const lines = input.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
    const parsed = lines.map((line, idx) => {
      const parts = line.split(/[|\t,]/).map(p => p.trim());
      const addr = parts[0];
      const nick = parts[1] || `Recipient #${idx + 1}`;
      const pct = parts[2] ? parseFloat(parts[2]) : undefined;
      return {
        address: addr,
        nickname: nick,
        percentage: pct,
        valid: isValidMultiChainAddress(addr),
      };
    });
    setParsedItems(parsed);
  };

  const handleSample = () => {
    sounds.playClick();
    const sample = `mn_test1q639a7g28h9x101y202z303a404b505c606d707e808f909g, Alex Developer
mn_test1q740b8h39i0y202z303a404b505c606d707e808f909g010h, Maya Designer
mn_test1q851c9i40j1z303a404b505c606d707e808f909g010h121i, Liam Auditor
mn_test1q962d0j51k2a404b505c606d707e808f909g010h121i232j, Zoe PM`;
    handleParse(sample);
  };

  const validCount = parsedItems.filter(i => i.valid).length;

  const handleConfirm = () => {
    sounds.playClick();
    const toImport = parsedItems.filter(i => i.valid).map(i => ({
      address: i.address,
      nickname: i.nickname,
      percentage: i.percentage,
    }));
    if (toImport.length > 0) {
      onImport(toImport);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,8,17,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="glass-panel animate-in w-full max-w-2xl flex flex-col gap-5" style={{ padding: '28px 32px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(139,92,246,0.15)] text-[#a78bfa]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
                Bulk Address Importer
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
                Paste lines of Midnight Shielded Addresses (mn_test...) or CSV (Address, Nickname)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="btn-ghost"
            style={{ padding: '8px' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Text Area */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Paste Addresses or CSV
            </label>
            <button
              onClick={handleSample}
              className="text-xs text-[#a78bfa] hover:underline flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load 4 Sample Recipients</span>
            </button>
          </div>
          <textarea
            rows={7}
            placeholder="mn_test1q639a7g28h9x101y202z303a404b505c606d707e808f909g, Alex&#10;mn_test1q740b8h39i0y202z303a404b505c606d707e808f909g010h, Maya"
            value={text}
            onChange={(e) => handleParse(e.target.value)}
            className="app-input app-input-mono"
            style={{ resize: 'vertical', minHeight: '140px', lineHeight: 1.6 }}
          />
        </div>

        {/* Live Parse Preview Status */}
        {parsedItems.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
              <span className="text-white font-medium">
                <strong>{validCount}</strong> valid addresses detected
              </span>
              {parsedItems.length - validCount > 0 && (
                <span className="text-[#f43f5e] font-medium">
                  ({parsedItems.length - validCount} invalid format)
                </span>
              )}
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Ready for Compact batch
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            style={{ fontSize: '0.82rem', padding: '10px 16px', background: 'transparent', color: 'var(--text-3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={validCount === 0}
            className="btn-primary text-xs sm:text-sm py-2.5 px-6"
            style={{ background: 'linear-gradient(135deg, var(--purple) 0%, #7c3aed 100%)' }}
          >
            <Upload className="w-4 h-4" />
            <span>Import {validCount} Recipients</span>
          </button>
        </div>

      </div>
    </div>
  );
};
