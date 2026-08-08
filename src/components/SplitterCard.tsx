import React from 'react';
import {
  Plus,
  Trash2,
  Sparkles,
  Upload,
  Share2,
  Users,
  CheckCircle2,
  AlertCircle,
  Shuffle,
  ArrowRight,
  Calculator,
  Percent,
  Sliders,
  Coins,
  Loader2,
  Wallet,
  DollarSign,
} from 'lucide-react';
import { Recipient, TokenInfo, SplitMode, ZKProofData } from '../types';
import { isValidMultiChainAddress, shortenAddress } from '../services/stellar';
import { sounds } from '../services/soundEffects';

interface SplitterCardProps {
  mode: SplitMode;
  onSelectMode: (m: SplitMode) => void;
  selectedToken: TokenInfo;
  onSelectToken: (t: TokenInfo) => void;
  tokens: TokenInfo[];
  customTokenAddress: string;
  onChangeCustomToken: (addr: string) => void;
  totalAmount: string;
  onChangeTotalAmount: (amt: string) => void;
  tipPercent: number;
  onSelectTip: (pct: number) => void;
  recipients: Recipient[];
  onAddRecipient: () => void;
  onRemoveRecipient: (id: string) => void;
  onUpdateRecipient: (id: string, updates: Partial<Recipient>) => void;
  onFillRandomAddress: (id: string) => void;
  onOpenBulkImport: () => void;
  onOpenGroups: () => void;
  onOpenShareModal: () => void;
  onExecuteSplit: () => void;
  isExecuting: boolean;
  isWalletConnected: boolean;
  onConnectWallet: () => void;
  zkProof?: ZKProofData | null;
}


const MODE_TABS: { mode: SplitMode; label: string; Icon: React.FC<{ style?: React.CSSProperties }> }[] = [
  { mode: 'equal',    label: 'Equal Split',     Icon: Calculator },
  { mode: 'weighted', label: 'Weighted %',       Icon: Percent },
  { mode: 'custom',   label: 'Custom Payouts',   Icon: Sliders },
];

const MODE_ACCENT: Record<SplitMode, string> = {
  equal:    'var(--cyan)',
  weighted: 'var(--purple)',
  custom:   'var(--gold)',
};
const MODE_ACCENT_DIM: Record<SplitMode, string> = {
  equal:    'var(--cyan-dim)',
  weighted: 'var(--purple-dim)',
  custom:   'var(--gold-dim)',
};

export const SplitterCard: React.FC<SplitterCardProps> = ({
  mode,
  onSelectMode,
  selectedToken,
  onSelectToken,
  tokens,
  customTokenAddress,
  onChangeCustomToken,
  totalAmount,
  onChangeTotalAmount,
  tipPercent,
  onSelectTip,
  recipients,
  onAddRecipient,
  onRemoveRecipient,
  onUpdateRecipient,
  onFillRandomAddress,
  onOpenBulkImport,
  onOpenGroups,
  onOpenShareModal,
  onExecuteSplit,
  isExecuting,
  isWalletConnected,
  onConnectWallet,
}) => {
  const numericTotal = parseFloat(totalAmount) || 0;
  const validRecipients = recipients.filter((r) => r.isValidAddress);
  const count = validRecipients.length;

  const totalWeight = recipients.reduce((acc, r) => acc + (r.percentage || 0), 0);
  const weightRemaining = 100 - totalWeight;
  const customSum = recipients.reduce(
    (acc, r) => acc + (parseFloat(r.customAmount || '0') || 0),
    0
  );

  const accentColor = MODE_ACCENT[mode];
  const accentDim   = MODE_ACCENT_DIM[mode];

  const canExecute =
    isWalletConnected &&
    !isExecuting &&
    count > 0 &&
    (mode !== 'custom' ? numericTotal > 0 : true) &&
    (mode === 'weighted' ? totalWeight === 100 : true);

  return (
    <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-1)',
                letterSpacing: '-0.01em',
              }}
            >
              Split Configuration
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '3px' }}>
              Define recipients and payout amounts
            </p>
          </div>
          <span className="badge badge-cyan">Stateless · Atomic</span>
        </div>

        {/* Mode Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-lg)',
            padding: '4px',
            gap: '4px',
            marginTop: '12px',
          }}
        >
          {MODE_TABS.map(({ mode: m, label, Icon }) => {
            const isActive = mode === m;
            return (
              <button
                key={m}
                onClick={() => {
                  sounds.playSwitch();
                  onSelectMode(m);
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  transition: 'all 0.2s var(--ease-out)',
                  background: isActive ? MODE_ACCENT_DIM[m] : 'transparent',
                  color: isActive ? MODE_ACCENT[m] : 'var(--text-3)',
                  boxShadow: isActive ? `0 0 12px ${MODE_ACCENT_DIM[m]}` : 'none',
                }}
              >
                <Icon style={{ width: '14px', height: '14px' }} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Amount + Token Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', alignItems: 'stretch' }}>
        {/* Amount Input */}
        <div
          className="glass-card-alt"
          style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="section-label">
              {mode === 'custom' ? 'Total (sum)' : 'Total Amount'}
            </span>
            {/* Quick-add buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[10, 50, 100, 500].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    const cur = parseFloat(totalAmount) || 0;
                    onChangeTotalAmount((cur + inc).toString());
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: accentColor,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={mode === 'custom' ? customSum.toString() : totalAmount}
              readOnly={mode === 'custom'}
              onChange={(e) => onChangeTotalAmount(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-1)',
                width: '100%',
              }}
            />
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: accentColor,
                flexShrink: 0,
              }}
            >
              {selectedToken.symbol}
            </span>
          </div>
        </div>

        {/* Token Selector */}
        <div
          className="glass-card-alt"
          style={{
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minWidth: '170px',
          }}
        >
          <span className="section-label">Token Asset</span>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedToken.symbol}
              onChange={(e) => {
                sounds.playClick();
                const found = tokens.find((t) => t.symbol === e.target.value);
                if (found) onSelectToken(found);
              }}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-md)',
                padding: '9px 36px 9px 12px',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
              }}
            >
              {tokens.map((t) => (
                <option key={t.symbol} value={t.symbol} style={{ background: 'var(--bg-card)' }}>
                  {t.icon} {t.symbol}
                </option>
              ))}
            </select>
            <Coins
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                color: 'var(--cyan)',
                pointerEvents: 'none',
              }}
            />
          </div>
          {selectedToken.balance && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
              Bal:{' '}
              <strong style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                {selectedToken.balance}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* ── Custom Token Input ── */}
      {selectedToken.symbol === 'CUSTOM' && (
        <div
          style={{
            padding: '14px 16px',
            background: 'var(--gold-dim)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)' }}>
            Soroban Contract Address (C…)
          </label>
          <input
            type="text"
            placeholder="CA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVTHG"
            value={customTokenAddress}
            onChange={(e) => onChangeCustomToken(e.target.value)}
            className="app-input app-input-mono"
            style={{ fontSize: '0.78rem' }}
          />
        </div>
      )}

      {/* ── Tip Bar (equal mode only) ── */}
      {mode === 'equal' && (
        <div
          className="glass-card-sm"
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <DollarSign style={{ width: '14px', height: '14px', color: 'var(--gold)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }}>
              Tip / Gratuity
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[0, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  sounds.playClick();
                  onSelectTip(pct);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: tipPercent === pct ? 'none' : '1px solid var(--border-soft)',
                  background: tipPercent === pct ? 'var(--gold)' : 'var(--bg-input)',
                  color: tipPercent === pct ? '#04080f' : 'var(--text-3)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {pct === 0 ? '0%' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Recipients Section ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-1)',
              }}
            >
              Recipients
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: accentColor,
                  background: accentDim,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {count} valid
              </span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '2px' }}>
              All valid keys execute in one transaction
            </p>
          </div>
          <div style={{ display: 'flex', gap: '7px' }}>
            <button
              className="btn-ghost"
              onClick={() => { sounds.playClick(); onOpenBulkImport(); }}
              title="Bulk CSV Import"
              style={{ padding: '7px 12px' }}
            >
              <Upload style={{ width: '13px', height: '13px', color: 'var(--cyan)' }} />
              <span>Bulk CSV</span>
            </button>
            <button
              className="btn-ghost"
              onClick={() => { sounds.playClick(); onOpenGroups(); }}
              title="Saved Groups"
              style={{ padding: '7px 12px' }}
            >
              <Users style={{ width: '13px', height: '13px', color: 'var(--purple)' }} />
              <span>Groups</span>
            </button>
            <button
              className="btn-ghost"
              onClick={() => { sounds.playClick(); onOpenShareModal(); }}
              title="Share Link"
              style={{ padding: '7px 12px' }}
            >
              <Share2 style={{ width: '13px', height: '13px', color: 'var(--gold)' }} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Weighted alert */}
        {mode === 'weighted' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: totalWeight === 100 ? 'var(--emerald-dim)' : 'var(--rose-dim)',
              border: `1px solid ${totalWeight === 100 ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: totalWeight === 100 ? 'var(--emerald)' : 'var(--rose)' }}>
              {totalWeight === 100 ? (
                <CheckCircle2 style={{ width: '14px', height: '14px' }} />
              ) : (
                <AlertCircle style={{ width: '14px', height: '14px' }} />
              )}
              <span>Allocated: <strong style={{ fontFamily: 'var(--font-mono)' }}>{totalWeight}%</strong> / 100%</span>
            </div>
            {totalWeight !== 100 && (
              <span style={{ color: 'var(--rose)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                {weightRemaining > 0 ? `${weightRemaining}% remaining` : `${Math.abs(weightRemaining)}% over`}
              </span>
            )}
          </div>
        )}

        {/* Recipients List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '360px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {recipients.map((recipient, idx) => {
            const isValid = recipient.isValidAddress;
            return (
              <div
                key={recipient.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isValid ? 'var(--bg-card-alt)' : 'var(--rose-dim)',
                  border: `1px solid ${
                    isValid ? 'var(--border-soft)' : 'rgba(244,63,94,0.2)'
                  }`,
                  transition: 'border-color 0.2s ease',
                  flexWrap: 'wrap',
                }}
              >
                {/* Number badge */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: isValid ? accentDim : 'var(--rose-dim)',
                    border: `1px solid ${isValid ? accentColor + '40' : 'rgba(244,63,94,0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: isValid ? accentColor : 'var(--rose)',
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </div>

                {/* Name input */}
                <input
                  type="text"
                  placeholder={`Recipient #${idx + 1}`}
                  value={recipient.nickname}
                  onChange={(e) => onUpdateRecipient(recipient.id, { nickname: e.target.value })}
                  className="app-input"
                  style={{ width: '130px', flexShrink: 0, fontSize: '0.8rem', padding: '8px 10px' }}
                />

                {/* Address input */}
                <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                  <input
                    type="text"
                    placeholder="Address (G… or mn_test1…)"
                    value={recipient.address}
                    onChange={(e) => {
                      const clean = e.target.value.trim();
                      onUpdateRecipient(recipient.id, {
                        address: clean,
                        isValidAddress: isValidMultiChainAddress(clean),
                      });
                    }}
                    className="app-input app-input-mono"
                    style={{
                      fontSize: '0.75rem',
                      padding: '8px 32px 8px 10px',
                      color: isValid ? 'var(--text-1)' : recipient.address ? 'var(--rose)' : 'var(--text-3)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    {isValid ? (
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: 'var(--emerald)' }} />
                    ) : recipient.address ? (
                      <AlertCircle style={{ width: '14px', height: '14px', color: 'var(--rose)' }} />
                    ) : null}
                  </div>
                </div>

                {/* Mode-specific field */}
                {mode === 'weighted' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="%"
                      value={recipient.percentage || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        onUpdateRecipient(recipient.id, { percentage: val });
                      }}
                      className="app-input"
                      style={{
                        width: '60px',
                        textAlign: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        padding: '8px 6px',
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--purple)', fontWeight: 700 }}>%</span>
                  </div>
                )}
                {mode === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Amt"
                      value={recipient.customAmount || ''}
                      onChange={(e) =>
                        onUpdateRecipient(recipient.id, { customAmount: e.target.value })
                      }
                      className="app-input"
                      style={{
                        width: '80px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        padding: '8px 6px',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700 }}>
                      {selectedToken.symbol}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => { sounds.playClick(); onFillRandomAddress(recipient.id); }}
                    title="Generate random address"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      color: 'var(--text-3)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--cyan)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-cyan)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-soft)';
                    }}
                  >
                    <Shuffle style={{ width: '13px', height: '13px' }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { sounds.playClick(); onRemoveRecipient(recipient.id); }}
                    disabled={recipients.length <= 1}
                    title="Remove recipient"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: 'var(--rose-dim)',
                      border: '1px solid rgba(244,63,94,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: recipients.length <= 1 ? 'not-allowed' : 'pointer',
                      opacity: recipients.length <= 1 ? 0.35 : 1,
                      transition: 'all 0.15s ease',
                      color: 'var(--rose)',
                    }}
                  >
                    <Trash2 style={{ width: '13px', height: '13px' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Recipient */}
        <button
          onClick={() => { sounds.playClick(); onAddRecipient(); }}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-mid)',
            background: 'transparent',
            color: 'var(--text-3)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cyan)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--cyan)';
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--cyan-dim)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-mid)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <Plus style={{ width: '15px', height: '15px' }} />
          Add Recipient Wallet
        </button>
      </div>

      {/* ── Execute CTA ── */}
      <div>
        {isWalletConnected ? (
          <button
            onClick={() => { sounds.playClick(); onExecuteSplit(); }}
            disabled={!canExecute}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: canExecute ? 'pointer' : 'not-allowed',
              opacity: canExecute ? 1 : 0.4,
              background: canExecute
                ? `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`
                : 'var(--bg-card-alt)',
              color: '#ffffff',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: canExecute ? `0 6px 24px ${accentColor}40` : 'none',
              transition: 'all 0.2s var(--ease-out)',
              letterSpacing: '-0.01em',
            }}
          >
            {isExecuting ? (
              <>
                <Loader2 style={{ width: '18px', height: '18px' }} className="animate-spin" />
                <span>Executing on Soroban…</span>
              </>
            ) : (
              <>
                <Sparkles style={{ width: '18px', height: '18px' }} />
                <span>Execute Atomic Split · {count} Wallets</span>
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => { sounds.playClick(); onConnectWallet(); }}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--cyan) 0%, #0099cc 100%)',
              color: '#04080f',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 6px 24px var(--cyan-glow)',
              transition: 'all 0.2s var(--ease-out)',
            }}
          >
            <Wallet style={{ width: '18px', height: '18px' }} />
            <span>Connect Wallet to Execute</span>
          </button>
        )}
      </div>
    </div>
  );
};
