import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Share2, Copy, Check, ExternalLink, Download } from 'lucide-react';
import { Recipient, TokenInfo, SplitMode } from '../types';
import { sounds } from '../services/soundEffects';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: SplitMode;
  token: TokenInfo;
  totalAmount: number;
  perRecipientShare: number;
  recipients: Recipient[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  mode,
  token,
  totalAmount,
  perRecipientShare,
  recipients,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Construct URL with query parameters
  const validRecipients = recipients.filter(r => r.isValidAddress);
  const params = new URLSearchParams();
  params.set('mode', mode);
  params.set('token', token.symbol);
  params.set('amount', totalAmount.toString());
  params.set('count', validRecipients.length.toString());
  if (validRecipients.length > 0) {
    params.set('recipients', validRecipients.map(r => `${r.address}:${r.nickname || ''}`).join(','));
  }
  const shareableUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

  const handleCopy = () => {
    sounds.playClick();
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,8,17,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="glass-panel animate-in w-full max-w-lg flex flex-col gap-5" style={{ padding: '28px 32px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(245,158,11,0.15)] text-[#fbbf24]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
                Share Payment Request
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
                Pre-filled link & QR code for group members to verify or pay
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

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#080d1a] border border-[var(--border-subtle)] gap-3 shadow-inner">
          <div className="p-4 bg-white rounded-2xl shadow-xl">
            <QRCodeSVG
              value={shareableUrl}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-white font-['Outfit'] block">
              Scan with Mobile Wallet
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {mode === 'equal' ? `${perRecipientShare} ${token.symbol} per person` : `${totalAmount} ${token.symbol} total`}
            </span>
          </div>
        </div>

        {/* Shareable Link Input */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Shareable URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              className="app-input app-input-mono"
              style={{ flex: 1, minWidth: 0 }}
            />
            <button
              onClick={handleCopy}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                copied
                  ? 'bg-[#10b981] text-[#050811]'
                  : 'btn-primary'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
