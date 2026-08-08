import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { isValidStellarAddress } from '../services/stellar';
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
      // Check if it's formatted as "address:nickname" or CSV
      const parts = line.split(/[|\t,]/).map(p => p.trim());
      const addr = parts[0];
      const nick = parts[1] || `Recipient #${idx + 1}`;
      const pct = parts[2] ? parseFloat(parts[2]) : undefined;
      return {
        address: addr,
        nickname: nick,
        percentage: pct,
        valid: isValidStellarAddress(addr),
      };
    });
    setParsedItems(parsed);
  };

  const handleSample = () => {
    sounds.playClick();
    const sample = `GAT6E47IWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY90123, Alex Developer
GBY7F58JXZ8AQXAWSGMUYR37X8H4F6S7XRY6F4M3B67RXF8S9UZ01234, Maya Designer
GCZ8G69KYA9BRYBXTHNVZS48Y9I5G7T8YSZ7G5N4C78SYG9T0VA12345, Liam Auditor
GDA9H70LZB0CSZCYUIOWAT59Z0J6H8U9ZTA8H6O5D89TZH0U1WB23456, Zoe PM`;
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
            <div className="p-2.5 rounded-xl bg-[rgba(0,242,254,0.12)] text-[#00f2fe]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
                Bulk Address Importer
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
                Paste lines of Stellar Public Keys (G...) or CSV (Address, Nickname)
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
              className="text-xs text-[#00f2fe] hover:underline flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load 4 Sample Recipients</span>
            </button>
          </div>
          <textarea
            rows={7}
            placeholder="GAT6E47IWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY90123, Alex&#10;GBY7F58JXZ8AQXAWSGMUYR37X8H4F6S7XRY6F4M3B67RXF8S9UZ01234, Maya"
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
              Ready for Soroban batch
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
          >
            <Upload className="w-4 h-4" />
            <span>Import {validCount} Recipients</span>
          </button>
        </div>

      </div>
    </div>
  );
};
