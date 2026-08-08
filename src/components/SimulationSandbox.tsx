import React from 'react';
import {
  Terminal,
  Play,
  ShieldCheck,
  RefreshCw,
  Circle,
} from 'lucide-react';
import { SimulationLog, TokenInfo, Recipient, SplitMode } from '../types';
import { sounds } from '../services/soundEffects';

interface SimulationSandboxProps {
  logs: SimulationLog[];
  isSimulating: boolean;
  onRunSimulation: () => void;
  token: TokenInfo;
  recipients: Recipient[];
  totalAmount: number;
  perRecipientShare: number;
  dust: number;
  mode: SplitMode;
}

const LOG_COLORS: Record<string, string> = {
  auth:     '#00d4ff',
  calc:     '#f59e0b',
  transfer: '#a78bfa',
  event:    '#f472b6',
  success:  '#10b981',
  warn:     '#f87171',
  info:     '#64748b',
};

const LOG_PREFIXES: Record<string, string> = {
  auth:     '🔐',
  calc:     '🧮',
  transfer: '⚡',
  event:    '📡',
  success:  '✅',
  warn:     '⚠️',
  info:     '📋',
};

export const SimulationSandbox: React.FC<SimulationSandboxProps> = ({
  logs,
  isSimulating,
  onRunSimulation,
  token,
  recipients,
  totalAmount,
  perRecipientShare,
  dust,
  mode,
}) => {
  const validRecipients = recipients.filter((r) => r.isValidAddress);
  const canRun = validRecipients.length > 0 && totalAmount > 0;

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>

      {/* ── Terminal Title Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        {/* macOS-style dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ff5f56', display: 'block' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ffbd2e', display: 'block' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#27c93f', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Terminal style={{ width: '13px', height: '13px', color: 'var(--purple)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
              soroban-sandbox ~ MidnightSplitterContract
            </span>
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={() => {
            sounds.playClick();
            onRunSimulation();
          }}
          disabled={isSimulating || !canRun}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: (isSimulating || !canRun) ? 'not-allowed' : 'pointer',
            opacity: (isSimulating || !canRun) ? 0.45 : 1,
            background: 'var(--purple)',
            color: '#ffffff',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.78rem',
            fontWeight: 700,
            transition: 'opacity 0.2s ease, transform 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isSimulating && canRun) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          {isSimulating ? (
            <RefreshCw style={{ width: '13px', height: '13px' }} className="animate-spin" />
          ) : (
            <Play style={{ width: '13px', height: '13px' }} />
          )}
          <span>{isSimulating ? 'Simulating…' : 'Simulate Tx'}</span>
        </button>
      </div>

      {/* ── Terminal Output ── */}
      <div
        style={{
          padding: '16px 20px',
          background: '#030507',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.77rem',
          minHeight: '200px',
          maxHeight: '240px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '160px',
              gap: '10px',
              color: 'var(--text-3)',
            }}
          >
            <Terminal style={{ width: '28px', height: '28px', opacity: 0.25 }} />
            <span style={{ fontSize: '0.78rem' }}>
              Click <strong style={{ color: 'var(--purple)' }}>Simulate Tx</strong> to preview execution logs
            </span>
          </div>
        ) : (
          logs.map((log, idx) => {
            const color = LOG_COLORS[log.type] || LOG_COLORS.info;
            const prefix = LOG_PREFIXES[log.type] || '';
            return (
              <div
                key={idx}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.6 }}
              >
                <span style={{ color: 'var(--text-3)', fontSize: '0.68rem', flexShrink: 0, marginTop: '1px' }}>
                  [{log.timestamp}]
                </span>
                <span
                  style={{
                    color,
                    fontWeight: log.type === 'success' ? 700 : 400,
                  }}
                >
                  {prefix} {log.message}
                </span>
                {log.detail && (
                  <span style={{ color: 'var(--text-3)', fontSize: '0.7rem' }}>
                    ({log.detail})
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Status Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-soft)',
          fontSize: '0.7rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-3)' }}>
          <ShieldCheck style={{ width: '12px', height: '12px', color: 'var(--emerald)' }} />
          <span>HostFunction::InvokeContract</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            require_auth(sender) ✓
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              className="pulse-dot"
              style={{
                display: 'block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--emerald)',
              }}
            />
            <span style={{ color: 'var(--text-3)' }}>Testnet</span>
          </div>
        </div>
      </div>
    </div>
  );
};
