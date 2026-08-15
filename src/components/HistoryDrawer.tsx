import React from 'react';
import { X, History, ExternalLink, Receipt, CheckCircle2, ArrowRight } from 'lucide-react';
import { SplitReceipt } from '../types';
import { shortenAddress } from '../services/midnightContract';
import { sounds } from '../services/soundEffects';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SplitReceipt[];
  onViewReceipt: (receipt: SplitReceipt) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onViewReceipt,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in" style={{ background: 'rgba(5,8,17,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="h-full w-full max-w-md flex flex-col gap-5" style={{ borderRadius: '0', borderLeft: '1px solid var(--border-soft)', background: 'var(--bg-card)', padding: '24px', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[rgba(139,92,246,0.15)] text-[#a78bfa]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>
                Transaction History
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                {history.length} splits executed on Midnight
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="btn-ghost"
            style={{ padding: '7px' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Receipts */}
        <div className="flex-1 flex flex-col gap-3">
          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)] gap-2">
              <History className="w-8 h-8 opacity-40" />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>No splits executed in this session yet.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-soft)', cursor: 'pointer', transition: 'border-color 0.2s ease',
                  display: 'flex', flexDirection: 'column', gap: '8px',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[#34d399] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Settled</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>
                    {item.timestamp}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
                    {item.totalAmount} {item.token.symbol}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {item.recipients.length} recipients
                  </span>
                </div>

                <div className="flex items-center justify-between" style={{ fontSize: '0.72rem', color: 'var(--text-3)', paddingTop: '6px', borderTop: '1px solid var(--border-soft)' }}>
                  <span className="font-mono">{shortenAddress(item.txHash, 4)}</span>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onViewReceipt(item);
                    }}
                    className="flex items-center gap-1"
                    style={{ color: 'var(--purple)', fontWeight: 600, fontSize: '0.72rem', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Clear Button */}
        {history.length > 0 && (
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-soft)' }}>
            <button
              onClick={() => {
                sounds.playClick();
                onClearHistory();
              }}
              className="btn-ghost w-full"
              style={{ fontSize: '0.78rem', justifyContent: 'center' }}
            >
              Clear Session History
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
