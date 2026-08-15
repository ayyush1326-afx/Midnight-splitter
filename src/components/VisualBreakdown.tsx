import React from 'react';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Gem,
  Users,
  PieChart,
} from 'lucide-react';
import { Recipient, TokenInfo, SplitMode } from '../types';
import { shortenAddress } from '../services/midnightContract';

interface VisualBreakdownProps {
  mode: SplitMode;
  totalAmount: number;
  perRecipientShare: number;
  dust: number;
  recipients: Recipient[];
  token: TokenInfo;
  tipAmount: number;
}

const PALETTE = [
  '#00d4ff', '#8b5cf6', '#f59e0b', '#10b981',
  '#ec4899', '#3b82f6', '#14b8a6', '#f97316',
];

export const VisualBreakdown: React.FC<VisualBreakdownProps> = ({
  mode,
  totalAmount,
  perRecipientShare,
  dust,
  recipients,
  token,
  tipAmount,
}) => {
  const effectiveTotal = totalAmount + tipAmount;
  const validRecipients = recipients.filter((r) => r.isValidAddress && r.address);
  const count = validRecipients.length;

  const rateToUsd = 1.0;
  const fiatTotal = (effectiveTotal * rateToUsd).toFixed(2);
  const fiatShare = count > 0 ? (perRecipientShare * rateToUsd).toFixed(2) : '0.00';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Hero: Total Payout ── */}
      <div
        className="glass-card"
        style={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--purple-dim)',
                border: '1px solid rgba(139,92,246,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp style={{ width: '16px', height: '16px', color: 'var(--purple)' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>
              Total Payout
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              background: 'var(--emerald-dim)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--emerald)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <ShieldCheck style={{ width: '11px', height: '11px' }} />
            Atomic Compact
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.6rem',
                  fontWeight: 800,
                  color: 'var(--text-1)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {effectiveTotal.toLocaleString()}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>
                {token.symbol}
              </span>
            </div>
            <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-3)' }}>
              ≈ ${fiatTotal} USD
            </div>
          </div>
          {tipAmount > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600 }}>Includes tip</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                +{tipAmount.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Per-person */}
        <div className="glass-card-sm" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--purple)', marginBottom: '6px' }}>
            {mode === 'equal' ? 'Each Receives' : 'Avg. Share'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)' }}>
              {count > 0
                ? mode === 'equal'
                  ? perRecipientShare.toLocaleString()
                  : (totalAmount / count).toFixed(2)
                : '—'}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>
              {token.symbol}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '3px' }}>
            ≈ ${fiatShare} / person
          </div>
        </div>

        {/* Recipients count */}
        <div className="glass-card-sm" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cyan)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users style={{ width: '11px', height: '11px' }} />
            Recipients
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)' }}>
              {count}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>wallets</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontWeight: 600, marginTop: '3px' }}>
            1 Compact Circuit Tx
          </div>
        </div>
      </div>

      {/* ── Disbursement Bar ── */}
      {count > 0 && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart style={{ width: '14px', height: '14px', color: 'var(--purple)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>
                Disbursement
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {count} transfer{count !== 1 ? 's' : ''} · 1 tx
            </span>
          </div>

          {/* Segment bar */}
          <div
            style={{
              height: '10px',
              width: '100%',
              borderRadius: '9999px',
              background: 'var(--bg-input)',
              overflow: 'hidden',
              display: 'flex',
              gap: '2px',
              padding: '0 2px',
            }}
          >
            {validRecipients.map((r, idx) => {
              let pct = 100 / count;
              if (mode === 'weighted' && r.percentage) pct = r.percentage;
              else if (mode === 'custom' && totalAmount > 0 && r.customAmount) {
                pct = (parseFloat(r.customAmount) / totalAmount) * 100;
              }
              return (
                <div
                  key={r.id || idx}
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    height: '100%',
                    background: PALETTE[idx % PALETTE.length],
                    borderRadius: '9999px',
                    transition: 'width 0.5s var(--ease-out)',
                  }}
                  title={`${r.nickname || shortenAddress(r.address)}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Legend chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {validRecipients.map((r, idx) => {
              let label = '';
              if (mode === 'equal') label = `${perRecipientShare} ${token.symbol}`;
              else if (mode === 'weighted') label = `${r.percentage || 0}%`;
              else label = `${r.customAmount || 0} ${token.symbol}`;

              return (
                <div
                  key={r.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    background: 'var(--bg-card-alt)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '0.72rem',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: PALETTE[idx % PALETTE.length],
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: 'var(--text-2)', fontWeight: 500, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.nickname || shortenAddress(r.address)}
                  </span>
                  <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dust + Fee strip ── */}
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
          <Gem style={{ width: '13px', height: '13px', color: 'var(--gold)' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 500 }}>
            Dust retained by sender:
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>
            {dust} <span style={{ fontSize: '0.7rem' }}>{token.symbol}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Zap style={{ width: '12px', height: '12px', color: 'var(--purple)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
            Fee: <strong style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>~0.000042 DUST</strong>
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--purple)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Preprod
          </span>
        </div>
      </div>

    </div>
  );
};
