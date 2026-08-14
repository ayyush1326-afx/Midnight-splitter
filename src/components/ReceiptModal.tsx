import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Copy, 
  Check, 
  Printer
} from 'lucide-react';
import { SplitReceipt } from '../types';
import { shortenAddress } from '../services/stellar';
import { sounds } from '../services/soundEffects';

interface ReceiptModalProps {
  isOpen?: boolean;
  receipt: SplitReceipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen = true,
  receipt,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !receipt) return null;

  const handleCopyProof = () => {
    sounds.playClick();
    const text = `--- MIDNIGHT SPLITTER VERIFIED RECEIPT ---
Tx Hash: ${receipt.txHash}
Ledger Block: #${receipt.blockLedger}
Network: ${receipt.network}
Timestamp: ${receipt.timestamp}
Token: ${receipt.token.symbol} (${receipt.token.address})
Total Disbursed: ${receipt.totalAmount} ${receipt.token.symbol}
Recipients Count: ${receipt.recipients.length}
Dust Retained by Sender: ${receipt.dust} ${receipt.token.symbol}
------------------------------------------`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      style={{ background: 'rgba(6,8,16,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={() => {
        sounds.playClick();
        onClose();
      }}
    >
      <div 
        className="glass-card w-full max-w-lg flex flex-col gap-6 relative" 
        style={{ padding: '28px 32px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          title="Close Receipt (Esc)"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-10">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-[#34d399] shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">Soroban Split Receipt</h3>
              <span className="badge badge-green text-[10px]">VERIFIED</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Atomic Ledger Settlement • Zero Escrow Loss
            </p>
          </div>
        </div>

        {/* Total & Dust Banner */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#080c14] border border-white/10">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Total Disbursed
            </span>
            <div className="text-2xl font-extrabold font-mono text-white">
              {receipt.totalAmount.toLocaleString()} <span className="text-sm font-bold text-[#00f2fe]">{receipt.token.symbol}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 items-end text-right">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Dust Retained
            </span>
            <div className="text-2xl font-extrabold font-mono text-[#fbbf24]">
              {receipt.dust} <span className="text-sm font-bold text-[#fbbf24]">{receipt.token.symbol}</span>
            </div>
          </div>
        </div>

        {/* Metadata Matrix - Clean Key/Value Rows */}
        <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Transaction Hash:</span>
            <span className="font-mono text-white font-semibold">{shortenAddress(receipt.txHash, 6)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Ledger Block:</span>
            <span className="font-mono text-white font-semibold">#{receipt.blockLedger}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Sender Wallet:</span>
            <span className="font-mono text-white font-semibold">{shortenAddress(receipt.sender, 5)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Network & Settlement:</span>
            <span className="font-semibold" style={{ color: receipt.walletProvider === 'lace' ? 'var(--purple)' : '#34d399' }}>
              {receipt.network}
            </span>
          </div>

          {receipt.zkProof && (
            <div
              style={{
                marginTop: '6px',
                paddingTop: '8px',
                borderTop: '1px dashed rgba(139, 92, 246, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-purple-400 font-semibold" style={{ color: 'var(--purple)' }}>
                  ZK Privacy Proof (Compact):
                </span>
                <span className="font-mono text-emerald-400 font-bold" style={{ color: 'var(--emerald)' }}>
                  VERIFIED (0 Fund Leakage)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Commitment Hash:</span>
                <span className="font-mono text-slate-300">{receipt.zkProof.commitment.slice(0, 18)}…</span>
              </div>
              <div className="text-[11px] text-slate-400 italic">
                {receipt.zkProof.privacyClaim}
              </div>
            </div>
          )}
        </div>

        {/* Recipient Disbursements List */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Recipient Disbursements ({receipt.recipients.length})
          </span>

          <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
            {receipt.recipients.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#00f2fe]/10 text-[#00f2fe] flex items-center justify-center font-mono font-bold text-[10px]">
                    #{i + 1}
                  </div>
                  <span className="font-medium text-white">
                    {r.nickname || shortenAddress(r.address, 4)}
                  </span>
                </div>
                <span className="font-mono font-bold text-[#00f2fe]">
                  {r.amount.toLocaleString()} {receipt.token.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyProof}
              className="btn-ghost flex items-center gap-1.5"
              style={{ fontSize: '0.78rem', padding: '8px 14px' }}
            >
              {copied ? <Check className="w-4 h-4" style={{ color: 'var(--emerald)' }} /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Proof'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-ghost flex items-center gap-1.5"
              style={{ fontSize: '0.78rem', padding: '8px 14px' }}
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="btn-primary flex items-center gap-1.5"
            style={{ fontSize: '0.85rem', padding: '10px 22px' }}
          >
            <span>Close Receipt</span>
          </button>
        </div>

      </div>
    </div>
  );
};

