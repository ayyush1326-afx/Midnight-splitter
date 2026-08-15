import React from 'react';
import {
  Terminal,
  History,
  Users,
  Code2,
  Sparkles,
  ChevronRight,
  Clock,
  Layers,
} from 'lucide-react';
import { SplitReceipt } from '../types';
import { shortenAddress } from '../services/midnightContract';
import { sounds } from '../services/soundEffects';

interface ToolsPageProps {
  // History
  history: SplitReceipt[];
  onOpenHistory: () => void;
  onViewReceipt: (r: SplitReceipt) => void;
  // Groups
  onOpenGroups: () => void;
  // Contract Inspector
  onOpenContractInspector: () => void;
  // Faucet
  onOpenFaucet: () => void;
  walletBalance: string;
}

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  actionLabel: string;
  accentColor: string;
  onClick: () => void;
  badge?: string;
}> = ({ icon, iconBg, title, description, actionLabel, accentColor, onClick, badge }) => (
  <div
    className="glass-card"
    onClick={onClick}
    style={{
      padding: '22px',
      cursor: 'pointer',
      transition: 'transform 0.2s var(--ease-out), box-shadow 0.2s ease, border-color 0.2s ease',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      (e.currentTarget as HTMLDivElement).style.borderColor = accentColor + '40';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-soft)';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      {badge && (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '9999px',
            background: accentColor + '20',
            border: `1px solid ${accentColor}40`,
            fontSize: '0.65rem',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {badge}
        </span>
      )}
    </div>
    <h3
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.95rem',
        fontWeight: 700,
        color: 'var(--text-1)',
        marginBottom: '5px',
      }}
    >
      {title}
    </h3>
    <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: '16px' }}>
      {description}
    </p>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.78rem',
        fontWeight: 700,
        color: accentColor,
      }}
    >
      {actionLabel}
      <ChevronRight style={{ width: '13px', height: '13px' }} />
    </div>
  </div>
);

export const ToolsPage: React.FC<ToolsPageProps> = ({
  history,
  onOpenHistory,
  onViewReceipt,
  onOpenGroups,
  onOpenContractInspector,
  onOpenFaucet,
  walletBalance,
}) => {
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Section: Feature Cards Grid ── */}
      <section>
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers style={{ width: '16px', height: '16px', color: 'var(--cyan)' }} />
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-1)',
            }}
          >
            Developer Tools
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' }}>
          <FeatureCard
            icon={<History style={{ width: '18px', height: '18px', color: 'var(--gold)' }} />}
            iconBg="var(--gold-dim)"
            title="Split History"
            description="View all previous split transactions with full receipts, tx hashes and ledger info."
            actionLabel="Open History"
            accentColor="var(--gold)"
            badge={history.length > 0 ? `${history.length} splits` : undefined}
            onClick={() => { sounds.playClick(); onOpenHistory(); }}
          />
          <FeatureCard
            icon={<Users style={{ width: '18px', height: '18px', color: 'var(--purple)' }} />}
            iconBg="var(--purple-dim)"
            title="Saved Groups"
            description="Manage reusable recipient groups and pre-set team configurations for fast splits."
            actionLabel="Manage Groups"
            accentColor="var(--purple)"
            onClick={() => { sounds.playClick(); onOpenGroups(); }}
          />
          <FeatureCard
            icon={<Code2 style={{ width: '18px', height: '18px', color: 'var(--cyan)' }} />}
            iconBg="var(--cyan-dim)"
            title="Contract Inspector"
            description="Explore the compiled Compact smart contract, ABI, circuits, and Midnight CLI workflow."
            actionLabel="Inspect Compact Contract"
            accentColor="var(--cyan)"
            badge="Compact v0.1.0"
            onClick={() => { sounds.playClick(); onOpenContractInspector(); }}
          />
          <FeatureCard
            icon={<Sparkles style={{ width: '18px', height: '18px', color: 'var(--emerald)' }} />}
            iconBg="var(--emerald-dim)"
            title="Preprod Faucet"
            description="Mint 1,000 tNIGHT / DUST tokens to your Midnight Preprod wallet for testing."
            actionLabel="Get +1,000 DUST"
            accentColor="var(--emerald)"
            onClick={() => { sounds.playClick(); onOpenFaucet(); }}
          />
        </div>
      </section>

      {/* ── Section: Recent Split History Preview ── */}
      {history.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock style={{ width: '16px', height: '16px', color: 'var(--gold)' }} />
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-1)',
                }}
              >
                Recent Activity
              </h2>
            </div>
            <button
              className="btn-ghost"
              onClick={() => { sounds.playClick(); onOpenHistory(); }}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              View All
              <ChevronRight style={{ width: '13px', height: '13px' }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.slice(0, 4).map((receipt) => (
              <div
                key={receipt.id}
                className="glass-card-alt"
                onClick={() => { sounds.playClick(); onViewReceipt(receipt); }}
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                  flexWrap: 'wrap',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-mid)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-soft)';
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--cyan-dim)',
                    border: '1px solid var(--border-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Terminal style={{ width: '15px', height: '15px', color: 'var(--cyan)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '2px' }}>
                    {receipt.totalAmount.toLocaleString()} {receipt.token.symbol} → {receipt.recipients.length} wallets
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {receipt.txHash.slice(0, 14)}… · {receipt.timestamp}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      padding: '3px 8px',
                      background: 'var(--emerald-dim)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: '9999px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--emerald)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Success
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '4px' }}>
                    Ledger #{receipt.blockLedger?.toLocaleString()}
                  </div>
                </div>
                <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--text-3)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
